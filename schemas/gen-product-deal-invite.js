const joi = require('joi');

const schema = joi.object({
    name: joi.string().required(),
    remarks: joi.string(),
    ram: joi.string(),
    storage: joi.string(),
    color: joi.string(),
    intent: joi.string().lowercase().required().valid("buy", "sell"),
})

module.exports.prdDetailSchema = schema