const { config } = require('../db/dbHandler');
const { getConfigValueSchema, saveConfigSchema } = require('../schemas/user-config');
const { configPipes } = require('../utils/config-mgmt');
const configEventHandler = require('../utils/eventEmitters/config-event-handler');
const { forEach } = require('p-iteration');

// Get configuration values
module.exports.getConfig = (req, res) => {
    const { key } = req.query;
    try {
        if (!key) {
            // If no specific key is provided, return all configuration values
            const configObj = config.getAll() || [];
            configObj.forEach((pair) => {
                // Apply transformation using configPipes if applicable
                if (configPipes[pair.key]?.send) {
                    pair.value = configPipes[pair.key].send(pair.value);
                }
            });
            res.send(configObj);
        } else {
            // Validate the provided key parameter
            const validation = getConfigValueSchema.validate(req.query);
            if (validation.error) {
                res.status(400).send({ result: 'error', message: validation.error.message });
                return;
            }
            // Get the value of the specified key
            const value = config.get(key);
            if (!value) {
                res.send([]);
            } else {
                // Apply transformation using configPipes if applicable
                if (configPipes[key]?.send) {
                    res.send([{ key: configPipes[key].send(value) }]);
                    return
                }
                res.send([{ key: value }]);
            }
        }
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message });
    }
};

// Save configuration values
module.exports.saveConfig = async (req, res) => {
    console.log('saveConfig', req.body);
    try {
        // Validate the request body containing the configuration pairs
        const validation = saveConfigSchema.validate(req.body);
        if (validation.error) {
            res.status(400).send({ result: 'error', message: validation.error.message });
            return;
        }
        const { pairs } = req.body;
        const pairKeys = pairs.map((pair) => pair.key);
        const saveObj = {};
        const error = {};

        await forEach(pairs, async (pair) => {
            // Apply transformation using configPipes if applicable
            if (configPipes[pair.key]?.recv) {
                pair.value = configPipes[pair.key].recv(pair.value);
            }
            if (configPipes[pair.key]?.validate) {
                // Validate the value using configPipes if applicable
                const validation = await configPipes[pair.key].validate(pair.value);
                if (validation.error) {
                    error[pair.key] = validation.error.message;
                    return;
                }
            }
            saveObj[pair.key] = pair.value;
        });

        // Save the configuration values in the database
        saveConfigInDb(saveObj);

        // Retrieve the saved configuration values from the database
        const configsInDB = config.getAll().filter((pair) => pairKeys.includes(pair.key));
        configsInDB.forEach((pair) => {
            // Apply transformation using configPipes if applicable
            if (configPipes[pair.key]?.send) {
                pair.value = configPipes[pair.key].send(pair.value);
            }
            if (error[pair.key]) {
                pair.error = error[pair.key];
            }
        });

        res.send(configsInDB);
        return;
    } catch (err) {
        console.error(err);
        res.status(500).send({ result: 'error', message: err.message });
    }
};

function saveConfigInDb(configObj) {
    console.log('saveConfigInDb', configObj);
    Object.entries(configObj).forEach(([key, value]) => {
        if (value) {
            config.set(key, value);
            configEventHandler.emit('configUpdated', { key, value });
        }
    });
}
