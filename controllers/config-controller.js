const { config } = require('../db/dbHandler')
const { getConfigValueSchema, saveConfigSchema } = require('../schemas/user-config')
const configEventHandler = require('../utils/eventEmitters/config-event-handler')

module.exports.getConfig = (req, res) => {
    const { key } = req.query
    try {
        if (!key) {
            const config_obj = config.getAll()
            if (!config_obj) {
                res.send([])
            } else {
                res.send(config_obj)
            }
        } else {
            const validation = getConfigValueSchema.validate(req.query);
            if (validation.error) {
                res.status(400).send({ result: 'error', message: validation.error.message });
                return;
            }
            const value = config.get(key)
            if (!value) {
                res.send([])
            } else {
                res.send([{ key: value }])
            }
        }
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message });
    }

}

module.exports.saveConfig = (req, res) => {
    try {
        const validation = saveConfigSchema.validate(req.body);
        if (validation.error) {
            res.status(400).send({ result: 'error', message: validation.error.message });
            return;
        }
        const { pairs } = req.body
        const saveObj = {}
        pairs.forEach((pair) => {
            saveObj[pair.key] = pair.value
        })

        saveConfigInDb(saveObj)

        res.send(saveObj);
        return;
    } catch (err) {
        console.error(err)
        res.status(500).send({ result: 'error', message: err.message });
    }
}

function saveConfigInDb(config_obj) {
    console.log('saveConfigInDb', config_obj)
    Object.keys(config_obj).forEach((key) => {
        if (config_obj[key]) {
            config.set(key, config_obj[key])
            configEventHandler.emit('configUpdated', { key, value: config_obj[key] })
        }
    })
}