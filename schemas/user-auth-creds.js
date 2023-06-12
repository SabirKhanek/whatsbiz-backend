const joi = require('joi');

const schema = joi.object({
    username: joi.string().required().min(3).max(20).regex(/^\S+$/),
    password: joi.string().required(),
})

exports.validate = (user) => {
    return schema.validate(user);
}