"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSocket = void 0;
var baileys_1 = require("@whiskeysockets/baileys");
var logger_1 = require("@whiskeysockets/baileys/lib/Utils/logger");
var fs = require("fs");
var promises_1 = require("fs/promises");
var events_1 = require("events");
// Define typed EventEmitter
var TypedEventEmitter = /** @class */ (function () {
    function TypedEventEmitter() {
        this.eventEmitter = new events_1.EventEmitter();
    }
    TypedEventEmitter.prototype.emit = function (event) {
        var _a;
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        return (_a = this.eventEmitter).emit.apply(_a, __spreadArray([event], args, false));
    };
    TypedEventEmitter.prototype.on = function (event, listener) {
        this.eventEmitter.on(event, listener);
    };
    return TypedEventEmitter;
}());
var logger = logger_1.default.child({});
logger.level = 'silent';
var useStore = !process.argv.includes('--no-store');
var doReplies = !process.argv.includes('--no-reply');
var sock;
var waClientEventHandler = new TypedEventEmitter();
var isConnected = false;
var storage = (process.env.storage_mount && fs.existsSync(process.env.storage_mount)) ? process.env.storage_mount + '/' : './';
try {
    fs.rmSync(storage + 'wweb_chat_store.json');
}
catch (err) { }
// the store maintains the data of the WA connection in memory
// can be written out to a file & read from it
var store = useStore ? (0, baileys_1.makeInMemoryStore)({ logger: logger }) : undefined;
store === null || store === void 0 ? void 0 : store.readFromFile(storage + 'wweb_chat_store.json');
// save every 10s
setInterval(function () {
    store === null || store === void 0 ? void 0 : store.writeToFile(storage + 'wweb_chat_store.json');
}, 10000);
// start a connection
var initSocket = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, state, saveCreds, _b, version, isLatest;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0: return [4 /*yield*/, (0, baileys_1.useMultiFileAuthState)(storage + 'wweb-session')
                // fetch latest version of WA Web
            ];
            case 1:
                _a = _c.sent(), state = _a.state, saveCreds = _a.saveCreds;
                return [4 /*yield*/, (0, baileys_1.fetchLatestBaileysVersion)()];
            case 2:
                _b = _c.sent(), version = _b.version, isLatest = _b.isLatest;
                console.log("using WA v".concat(version.join('.'), ", isLatest: ").concat(isLatest));
                sock = (0, baileys_1.default)({
                    version: version,
                    logger: logger,
                    browser: baileys_1.Browsers.ubuntu('Desktop'),
                    printQRInTerminal: false,
                    auth: {
                        creds: state.creds,
                        /** caching makes the store faster to send/recv messages */
                        keys: (0, baileys_1.makeCacheableSignalKeyStore)(state.keys, logger),
                    },
                    generateHighQualityLinkPreview: true,
                });
                store === null || store === void 0 ? void 0 : store.bind(sock.ev);
                sock.ev.on('creds.update', function () {
                    saveCreds();
                });
                sock.ev.on('connection.update', function (update) { return __awaiter(void 0, void 0, void 0, function () {
                    var knownDisconnectReasons, reason;
                    var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
                    return __generator(this, function (_o) {
                        if (update.connection === 'connecting') {
                            waClientEventHandler.emit('wa-connecting');
                        }
                        else if (update.connection === 'open') {
                            waClientEventHandler.emit('wa-connected', { username: ((_a = sock.user) === null || _a === void 0 ? void 0 : _a.name) || ((_b = sock.user) === null || _b === void 0 ? void 0 : _b.verifiedName), id: (_c = sock.user) === null || _c === void 0 ? void 0 : _c.id.split('@')[0], });
                            isConnected = true;
                        }
                        else if (update.connection === 'close') {
                            isConnected = false;
                            if (((_f = (_e = (_d = update.lastDisconnect) === null || _d === void 0 ? void 0 : _d.error) === null || _e === void 0 ? void 0 : _e.output) === null || _f === void 0 ? void 0 : _f.statusCode) !== baileys_1.DisconnectReason.loggedOut) {
                                initSocket();
                            }
                            else {
                                fs.rmSync(storage + 'wweb-session', { recursive: true });
                                // console.log('Connection closed. You are logged out.')
                                // console.log('Logging in again...')
                                initSocket();
                            }
                            knownDisconnectReasons = {
                                428: 'Connection closed',
                                408: 'Connection lost',
                                440: 'Connection replaced',
                                401: 'Logged out',
                                500: 'Bad session',
                                515: 'Restart required',
                                411: 'Multi-device mismatch'
                            };
                            reason = knownDisconnectReasons[(_j = (_h = (_g = update.lastDisconnect) === null || _g === void 0 ? void 0 : _g.error) === null || _h === void 0 ? void 0 : _h.output) === null || _j === void 0 ? void 0 : _j.statusCode] || 'unexpected';
                            waClientEventHandler.emit('wa-disconnected', { statusCode: (_m = (_l = (_k = update.lastDisconnect) === null || _k === void 0 ? void 0 : _k.error) === null || _l === void 0 ? void 0 : _l.output) === null || _m === void 0 ? void 0 : _m.statusCode, disconnectReason: reason });
                        }
                        else if (update.qr) {
                            waClientEventHandler.emit('wa-qr', update.qr);
                        }
                        return [2 /*return*/];
                    });
                }); });
                sock.ev.on('messages.upsert', function (upsert) { return __awaiter(void 0, void 0, void 0, function () {
                    var _i, _a, msg, messageObj, err_1;
                    return __generator(this, function (_b) {
                        switch (_b.label) {
                            case 0:
                                if (!(upsert.type === 'notify')) return [3 /*break*/, 6];
                                _i = 0, _a = upsert.messages;
                                _b.label = 1;
                            case 1:
                                if (!(_i < _a.length)) return [3 /*break*/, 6];
                                msg = _a[_i];
                                if (!(!msg.key.fromMe && doReplies)) return [3 /*break*/, 5];
                                _b.label = 2;
                            case 2:
                                _b.trys.push([2, 4, , 5]);
                                return [4 /*yield*/, extractMessageInfo(msg)];
                            case 3:
                                messageObj = _b.sent();
                                waClientEventHandler.emit('new-text-message', messageObj);
                                return [3 /*break*/, 5];
                            case 4:
                                err_1 = _b.sent();
                                return [3 /*break*/, 5];
                            case 5:
                                _i++;
                                return [3 /*break*/, 1];
                            case 6: return [2 /*return*/];
                        }
                    });
                }); });
                return [2 /*return*/, sock];
        }
    });
}); };
// kilo eyaz
// adha kilo tamatar
// 10 ki mirchien
// adh pao adrak
function isWAConnected() {
    return isConnected;
}
var isContact = function (id) {
    var contacts = store === null || store === void 0 ? void 0 : store.contacts;
    var flag = false;
    Object.keys(contacts).forEach(function (contact) {
        if (contact == id) {
            flag = true;
        }
    });
    return flag;
};
function getParticipatingGroups() {
    return __awaiter(this, void 0, void 0, function () {
        var groupChats, groupChatsArray;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sock.groupFetchAllParticipating()];
                case 1:
                    groupChats = _a.sent();
                    groupChatsArray = Object.keys(groupChats).map(function (key) {
                        var _a;
                        return {
                            id: key,
                            name: groupChats[key].subject,
                            description: groupChats[key].desc,
                            participants: groupChats[key].participants.map(function (participant) { return participant.id.split('@')[0]; }),
                            owner: (_a = groupChats[key].owner) === null || _a === void 0 ? void 0 : _a.split('@')[0],
                        };
                    });
                    return [2 /*return*/, groupChatsArray];
            }
        });
    });
}
function extractMessageInfo(message) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var remoteJid, chatName, groupInfo, authorName, messageContent, messageType, messageTimestamp, filename, messageId;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    remoteJid = message.key.remoteJid;
                    chatName = '';
                    if (!remoteJid.includes('@g')) return [3 /*break*/, 2];
                    return [4 /*yield*/, sock.groupMetadata(remoteJid)];
                case 1:
                    groupInfo = _d.sent();
                    chatName = groupInfo.subject;
                    return [3 /*break*/, 3];
                case 2:
                    if (remoteJid.includes('status@broadcast')) {
                        throw new Error('Status messages are not supported');
                    }
                    else {
                        chatName = message.pushname ? message.pushname : remoteJid.split('@')[0];
                    }
                    _d.label = 3;
                case 3:
                    authorName = remoteJid.includes('@g') ? message.key.participant.split('@')[0] : remoteJid.split('@')[0];
                    messageContent = '';
                    messageType = '';
                    messageTimestamp = message.messageTimestamp;
                    if (message.message.conversation) {
                        messageContent = message.message.conversation;
                        messageType = 'text';
                    }
                    else if (message.message.audioMessage) {
                        filename = 'audio.ogg';
                        messageType = 'audio';
                        downloadAudioMessage(message, filename);
                        messageContent = filename;
                    }
                    else if (message.message.imageMessage || message.message.videoMessage) {
                        messageType = 'media';
                        messageContent = (((_a = message.message.imageMessage) === null || _a === void 0 ? void 0 : _a.caption) || ((_b = message.message.videoMessage) === null || _b === void 0 ? void 0 : _b.caption) || '');
                    }
                    else if (message.message.extendedTextMessage) {
                        messageType = 'text/business';
                        messageContent = message.message.extendedTextMessage.text;
                    }
                    else if (message.message.documentMessage) {
                        messageType = 'document';
                        messageContent = message.message.documentMessage.caption || message.message.documentMessage.fileName || '';
                    }
                    else if (message.message.documentWithCaptionMessage) {
                        messageType = 'document';
                        messageContent = ((_c = message.message.documentWithCaptionMessage.message.documentMessage) === null || _c === void 0 ? void 0 : _c.caption) || '';
                    }
                    messageId = message.key.id || '';
                    return [2 /*return*/, {
                            chatName: chatName,
                            authorName: authorName,
                            messageContent: messageContent,
                            messageId: messageId,
                            messageTimestamp: messageTimestamp,
                            isContact: isContact(remoteJid),
                            messageType: messageType,
                            chatId: remoteJid
                        }];
            }
        });
    });
}
var getSocket = function () {
    return sock;
};
exports.getSocket = getSocket;
function downloadAudioMessage(message, filename) {
    var _a;
    if (filename === void 0) { filename = 'audio.ogg'; }
    return __awaiter(this, void 0, void 0, function () {
        var buffer;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (!((_a = message.message) === null || _a === void 0 ? void 0 : _a.audioMessage))
                        throw new Error('Message is not an audio message');
                    return [4 /*yield*/, (0, baileys_1.downloadMediaMessage)(message, 'buffer', {}, {
                            logger: logger,
                            // pass this so that baileys can request a reupload of media
                            // that has been deleted
                            reuploadRequest: sock.updateMediaMessage
                        })];
                case 1:
                    buffer = _b.sent();
                    return [4 /*yield*/, (0, promises_1.writeFile)(filename, buffer)];
                case 2:
                    _b.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function setTypingStatus(recipient) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, sock.sendPresenceUpdate('composing', recipient)];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function sendTextMessage(recipient, text) {
    return __awaiter(this, void 0, void 0, function () {
        var err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    // await setTypingStatus(recipient)
                    // await sock.sendPresenceUpdate('paused', recipient)
                    if (!text && (text === null || text === void 0 ? void 0 : text.length) <= 0)
                        throw new Error('Empty message');
                    return [4 /*yield*/, sock.sendMessage(recipient, { text: text })];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    err_2 = _a.sent();
                    console.log('Error sending text message: ', err_2);
                    throw new Error("Error sending text message: ".concat(err_2));
                case 3: return [2 /*return*/];
            }
        });
    });
}
function sendImageMessage(recipient, imageUrl, caption) {
    if (caption === void 0) { caption = ""; }
    return __awaiter(this, void 0, void 0, function () {
        var err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, sock.sendPresenceUpdate('paused', recipient)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, sock.sendMessage(recipient, { image: { url: imageUrl }, caption: caption })];
                case 2:
                    _a.sent();
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    console.log('Error sending image message: ', err_3);
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    });
}
module.exports.getSocket = exports.getSocket;
module.exports.init = initSocket;
module.exports.restart = function flushSock() {
    if (sock) {
        var oldSock = sock;
        oldSock.ev.removeAllListeners();
        oldSock.end();
        initSocket();
    }
};
module.exports.logout = function logoutSock() {
    if (sock) {
        sock.logout();
    }
};
module.exports.isWAConnected = isWAConnected;
module.exports.ev = waClientEventHandler;
module.exports.sendTextMessage = sendTextMessage;
module.exports.sendImageMessage = sendImageMessage;
module.exports.getParticipatingGroups = getParticipatingGroups;
