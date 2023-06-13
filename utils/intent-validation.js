const Joi = require('joi')

const product = Joi.object({
    intent: Joi.string().valid('Buy', 'Sell').required(),
    name: Joi.string().required().invalid('-'),
    type: Joi.string().required().allow(''),
    ram: Joi.string().allow(""),
    color: Joi.string().allow(""),
    quantity: Joi.alternatives().try(Joi.number(), Joi.string().allow("")),
    condition: Joi.string().allow(""),
    storage: Joi.string().allow(""),
    processor: Joi.string().allow(""),
    brand: Joi.string().allow(""),
    price: Joi.string().allow(""),
    remarks: Joi.string().allow(""),
})

const dataSchemaJoi = Joi.object({
    products: Joi.array().items(product).min(1)
})


module.exports.validateIntent = dataSchemaJoi