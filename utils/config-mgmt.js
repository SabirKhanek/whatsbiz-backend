const { config } = require('../db/dbHandler');
const eventHandler = require('./eventEmitters/config-event-handler')
const { modifyInterval } = require('./new_message_cron')

module.exports.applyDefault = function () {
    const default_config = {
        newMessageInterval: 60 * 60 * 1000, // 1 hour
        openai_key: process.env.openai_key
    }

    Object.keys(default_config).forEach((key) => {
        if (!config.get(key) && default_config[key]) {
            config.set(key, default_config[key])
        }
    })
}

eventHandler.on('configUpdated', (data) => {
    switch (data.key) {
        case 'newMessageInterval': handleIntervalUpdate(data.value)
    }
})

handleIntervalUpdate = (value) => {
    modifyInterval()
}
