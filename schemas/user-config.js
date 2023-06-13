const joi = require('joi');

const key_val = joi.object({
    key: joi.string().required(),
    value: joi.string().required()
})

const schema = joi.object({
    pairs: joi.array().items(key_val).required()
})

const getValue = joi.object({
    key: joi.string().required()
})

module.exports.saveConfigSchema = schema
module.exports.getConfigValueSchema = getValue