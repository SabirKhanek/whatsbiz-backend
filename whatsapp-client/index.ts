import { Boom } from '@hapi/boom'
import makeWASocket, { AnyMessageContent, delay, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, makeInMemoryStore, proto, useMultiFileAuthState, WAMessageContent, WAMessageKey, downloadMediaMessage, Browsers } from '@whiskeysockets/baileys'
import MAIN_LOGGER from '@whiskeysockets/baileys/lib/Utils/logger'
import * as fs from 'fs'
import { writeFile } from 'fs/promises'
import { NewWAMessage, ClientDisconnectEvent, ClientConnectEvent, NewQRgenEvent } from '../types/waClientTypes'
import { EventEmitter } from 'events'

// Define custom event types
type WaConnectingEvent = void;
type WaQrEvent = NewQRgenEvent;
type WaConnectedEvent = ClientConnectEvent;
type WaDisconnectedEvent = ClientDisconnectEvent;
type NewTextMessageEvent = NewWAMessage;

// Define event map type
type EventMap = {
    'wa-connecting': WaConnectingEvent;
    'wa-qr': WaQrEvent;
    'wa-connected': WaConnectedEvent;
    'wa-disconnected': WaDisconnectedEvent;
    'new-text-message': NewTextMessageEvent;
};

// Define typed EventEmitter
class TypedEventEmitter<T extends Record<keyof T, unknown>> {
    private eventEmitter: EventEmitter;

    constructor() {
        this.eventEmitter = new EventEmitter();
    }

    emit<K extends keyof T>(event: K, ...args: T[K] extends void ? [] : [T[K]]): boolean {
        return this.eventEmitter.emit(event as string, ...args);
    }

    on<K extends keyof T>(event: K, listener: (arg: T[K]) => void): void {
        this.eventEmitter.on(event as string, listener);
    }
}

const logger = MAIN_LOGGER.child({})
logger.level = 'silent'

const useStore = !process.argv.includes('--no-store')
const doReplies = !process.argv.includes('--no-reply')

var sock;
const waClientEventHandler = new TypedEventEmitter<EventMap>();
var isConnected = false;


// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
const store = useStore ? makeInMemoryStore({ logger }) : undefined
store?.readFromFile('./wweb_chat_store.json')

// save every 10s
setInterval(() => {
    store?.writeToFile('./wweb_chat_store.json')
}, 10_000)

// start a connection
const initSocket = async () => {

    const { state, saveCreds } = await useMultiFileAuthState('wweb-session')
    // fetch latest version of WA Web
    const { version, isLatest } = await fetchLatestBaileysVersion()
    console.log(`using WA v${version.join('.')}, isLatest: ${isLatest}`)

    sock = makeWASocket({
        version,
        logger,
        browser: Browsers.ubuntu('Desktop'),
        printQRInTerminal: false,
        auth: {
            creds: state.creds,
            /** caching makes the store faster to send/recv messages */
            keys: makeCacheableSignalKeyStore(state.keys, logger),
        },
        generateHighQualityLinkPreview: true,
    })

    store?.bind(sock.ev)

    sock.ev.on('creds.update', () => {
        saveCreds()
    })

    sock.ev.on('connection.update', async (update: any) => {
        if (update.connection === 'connecting') {
            waClientEventHandler.emit('wa-connecting')
        } else if (update.connection === 'open') {
            waClientEventHandler.emit('wa-connected', { username: sock.user?.name || sock.user?.verifiedName, id: sock.user?.id.split('@')[0], })
            isConnected = true;
        } else if (update.connection === 'close') {
            isConnected = false;
            if ((update.lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut) {
                initSocket()
            } else {
                fs.rmSync('wweb-session', { recursive: true })

                // console.log('Connection closed. You are logged out.')

                // console.log('Logging in again...')
                initSocket()
            }

            const knownDisconnectReasons = {
                428: 'Connection closed',
                408: 'Connection lost',
                440: 'Connection replaced',
                401: 'Logged out',
                500: 'Bad session',
                515: 'Restart required',
                411: 'Multi-device mismatch'
            }

            const reason = knownDisconnectReasons[update.lastDisconnect?.error?.output?.statusCode] || 'unexpected'

            waClientEventHandler.emit('wa-disconnected', { statusCode: update.lastDisconnect?.error?.output?.statusCode, disconnectReason: reason })
        } else if (update.qr) {
            waClientEventHandler.emit('wa-qr', update.qr)
        }
    })

    sock.ev.on('messages.upsert', async (upsert: any) => {
        if (upsert.type === 'notify') {
            for (const msg of upsert.messages) {
                if (!msg.key.fromMe && doReplies) {
                    const messageObj = extractMessageInfo(msg);
                    waClientEventHandler.emit('new-text-message', messageObj)
                    await sock?.readMessages([msg.key])
                }
            }
        }
    })

    return sock
}

function isWAConnected() {
    return isConnected;
}

const isContact = (id: any) => {
    const contacts: any = store?.contacts
    let flag = false;
    Object.keys(contacts).forEach((contact: string) => {
        if (contact == id) {
            flag = true
        }
    })
    return flag
}

function extractMessageInfo(message): NewWAMessage {
    const remoteJid = message.key.remoteJid;
    const chatName = remoteJid.includes('@g') ? sock.groupMetadata(remoteJid).subject : remoteJid.split('@')[0];
    const authorName = message.pushName || message.verifiedBizName || '';
    let messageContent = '';
    let messageType = ''
    const messageTimestamp = message.messageTimestamp;

    if (message.message.conversation) {
        messageContent = message.message.conversation;
        messageType = 'text'
    } else if (message.message.audioMessage) {
        const filename = 'audio.ogg'
        messageType = 'audio'
        downloadAudioMessage(message, filename);
        messageContent = filename;
    } else if (message.message.imageMessage || message.message.videoMessage) {
        messageType = 'media'
        messageContent = (message.message.imageMessage?.caption || message.message.videoMessage?.caption || '');
    } else if (message.message.extendedTextMessage) {
        messageType = 'text/business'
        messageContent = message.message.extendedTextMessage.text;
    } else if (message.message.documentMessage) {
        messageType = 'document'
        messageContent = message.message.documentMessage.caption || message.message.documentMessage.fileName || '';
    } else if (message.message.documentWithCaptionMessage) {
        messageType = 'document'
        messageContent = message.message.documentWithCaptionMessage.message.documentMessage?.caption || '';
    }

    const messageId = message.key.id || '';

    return {
        chatName,
        authorName,
        messageContent,
        messageId,
        messageTimestamp,
        isContact: isContact(remoteJid),
        messageType,
        chatId: remoteJid
    };
}

export const getSocket = () => {
    return sock
}

async function downloadAudioMessage(message: proto.IWebMessageInfo, filename = 'audio.ogg') {
    if (!message.message?.audioMessage) throw new Error('Message is not an audio message')
    const buffer = await downloadMediaMessage(message,
        'buffer',
        {},
        {
            logger,
            // pass this so that baileys can request a reupload of media
            // that has been deleted
            reuploadRequest: sock.updateMediaMessage
        })
    await writeFile(filename, buffer)
}

async function setTypingStatus(recipient: string) {
    await sock.sendPresenceUpdate('composing', recipient)
}

async function sendTextMessage(recipient: string, text: string) {
    try {
        // await setTypingStatus(recipient)
        // await sock.sendPresenceUpdate('paused', recipient)
        if (!text && text?.length <= 0) throw new Error('Empty message')
        await sock.sendMessage(recipient, { text })
    } catch (err) {
        console.log('Error sending text message: ', err)
        throw new Error(`Error sending text message: ${err}`)
    }

}

async function sendImageMessage(recipient: string, imageUrl: string, caption = "") {
    try {
        await sock.sendPresenceUpdate('paused', recipient)
        await sock.sendMessage(recipient, { image: { url: imageUrl }, caption })
    } catch (err) {
        console.log('Error sending image message: ', err)
    }
}


module.exports.getSocket = getSocket
module.exports.init = initSocket
module.exports.restart = function flushSock() {
    if (sock) {
        sock.ev.removeAllListeners()
        sock.end()
        sock = undefined
        initSocket()
    }
}
module.exports.logout = function logoutSock() {
    if (sock) {
        sock.logout()
    }
}
module.exports.isWAConnected = isWAConnected
module.exports.ev = waClientEventHandler
module.exports.sendTextMessage = sendTextMessage
module.exports.sendImageMessage = sendImageMessage