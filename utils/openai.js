const { Configuration, OpenAIApi } = require("openai")
const { config } = require('../db/dbHandler');

const getOpenAI = () => {
    const configuration = new Configuration({
        apiKey: config.get('openai_key')
    })
    return new OpenAIApi(configuration)
}


module.exports.getOpenAI = getOpenAI; 