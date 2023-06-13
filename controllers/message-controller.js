const { ifMessageExist, isClassifed } = require('../db/dbHandler');
const { get_classification } = require('./classification-controller')
const { newMessages } = require('../db/dbHandler');

module.exports.handleNewMessage = async function (message) {
    console.log('Handling new message')
    const msg = await getMessageObj(message)
    if (!msg) return
    newMessages.save(msg)
}

async function getMessageObj(message) {
    console.log('Getting message obj')
    if (ifMessageExist(message.messageId, message.messageContent) || message.messageContent <= 10) {
        console.log('Message already exist or message is too short', ifMessageExist(message.messageId, message.messageContent), (message.messageContent <= 10))
        return
    }

    if (isClassifed(message.messageContent)) {
        console.log('Message already classified')
        return
    }

    console.log('new generated message obj', {
        chatId: message.chatId,
        chatName: message.chatName,
        chatType: message.messageType,
        chatMessage: message.messageContent,
        chatMessageAuthor: message.authorName,
        chatMessageTime: message.messageTimestamp,
        id: message.messageId,
        fromMe: /*message.fromMe*/ false
    })

    return ({
        chatId: message.chatId,
        chatName: message.chatName,
        chatType: message.messageType,
        chatMessage: message.messageContent,
        chatMessageAuthor: message.authorName,
        chatMessageTime: message.messageTimestamp,
        id: message.messageId,
        fromMe: /*message.fromMe*/ false
    })
}

module.exports.getBatchClassifiedMessages = async function getBatchClassifiedMessages(messages) {
    console.log('Getting batch classified messages')
    try {
        const message_bodies = messages.map(message => message.chatMessage)
        const classification = await get_classification(message_bodies)
        messages = messages.filter(message => {
            if (classification[message.chatMessage] === 'Buy' || classification[message.chatMessage] === 'Sell') {
                return true
            }
        })
        messages.forEach(message => {
            message.predictedIntent = classification[message.chatMessage]
        })
        return messages
    } catch (err) {
        return []
    }
}

