const { saveIntents, newMessages, execSql, config, getServerConfig } = require('../db/dbHandler');
const { getBatchClassifiedMessages } = require('../controllers/message-controller')
const { getIntents } = require('./intents')

// New Messages temporary storage for barch intent generation
var currentSessionMessageBodies = []

async function generateNewMsgIntents() {
    console.log('Generating new messages intents from generateNewMsgIntents()')
    const messages = newMessages.get()

    console.log(`${messages.length} new messages found`)

    if (newMessages.get().length <= 0) return

    const currentMessages = [...messages]
    newMessages.delete()
    currentSessionMessageBodies = []
    const msgs = await getBatchClassifiedMessages(currentMessages)

    if (msgs.length <= 0) return

    getIntents(msgs).then((intents) => {
        console.log('Saving intents')
        saveIntents(intents)
    }).catch((err) => {
        console.log('Error while getting intents: ', err)
    })
}

var newMessageCronJon

module.exports.initCronJob = function initCronJob() {
    console.log('Initializing new message cron job with interval: ', config.get('newMessageInterval'))
    newMessageCronJon = setInterval(generateNewMsgIntents, config.get('newMessageInterval'))
}

module.exports.modifyInterval = function modifyInterval() {

    console.log('Modifying new message cron job interval to: ', config.get('newMessageInterval'))
    clearInterval(newMessageCronJon)
    newMessageCronJon = setInterval(generateNewMsgIntents, config.get('newMessageInterval'))
}
