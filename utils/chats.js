const _ = require('lodash')
const { forEach } = require('p-iteration')
const { TimeFilter } = require('../config');
const { getMessageIds, ifMessageExist, isClassifed } = require('../../db/dbhandler');
const { get_classification } = require('../../classification-handler')
var client;

function setClient(_client) {
    client = _client
}

async function getMessageObj(message) {
    if (message.fromMe || ifMessageExist(message.id._serialized, message.body) || !(message.body.length > 10)) {
        return
    }

    if (isClassifed(message.body)) {
        return
    }

    const chat = await message.getChat()

    return ({
        chatId: chat.id._serialized,
        chatName: chat.name,
        chatType: chat.isGroup ? "Group" : "Individual",
        chatMessage: message.body,
        chatMessageAuthor: chat.isGroup ? message.author : chat.name,
        chatMessageTime: message.timestamp,
        id: message.id._serialized,
        fromMe: message.fromMe
    })

}

async function getBatchClassifiedMessages(messages) {
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

async function getMessages() {
    const messagesInDb = getMessageIds()
    if (!client) throw new Error('client is undefined. setClient to resolve this issue')
    let messages = []
    const chats = await client.getChats();
    await forEach(chats, async (chat) => {
        let timeFrom = (new Date().getTime()) / 1000;
        timeFrom = timeFrom - (TimeFilter.getTime() ? TimeFilter.getTime() : 3600)

        // get messages from chat
        var chatMessages = (await chat.fetchMessages(fromMe = false, limit = chat.isGroup ? 1000 : 1000)).filter(message => message.timestamp > timeFrom && !message.fromMe && !ifMessageExist(message.id._serialized, message.body) && message.body.length > 10).map(message => {
            return ({
                chatId: chat.id._serialized,
                chatName: chat.name,
                chatType: chat.isGroup ? "Group" : "Individual",
                chatMessage: message.body,
                chatMessageAuthor: chat.isGroup ? message.author : chat.name,
                chatMessageTime: message.timestamp,
                id: message.id._serialized,
                fromMe: message.fromMe
            })
        });

        messages.push(...chatMessages)
    })

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
    } catch (error) {
        console.log('Error in classification because of ', error)
    }

    return _(messages).sortBy('chatMessageTime').value()
}

module.exports.setClient = setClient
module.exports.getMessages = getMessages
module.exports.getMessageObj = getMessageObj
module.exports.getBatchClassifiedMessages = getBatchClassifiedMessages