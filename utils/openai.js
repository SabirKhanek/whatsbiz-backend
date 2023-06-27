const { Configuration, OpenAIApi } = require("openai")
const { config } = require('../db/dbHandler');

const getOpenAI = () => {
    const configuration = new Configuration({
        apiKey: config.get('openai_key')
    })
    return new OpenAIApi(configuration)
}

async function checkOpenAIKey(apiKey) {
    try {
        const configuration = new Configuration({
            apiKey: apiKey
        });
        const openai = new OpenAIApi(configuration)
        const response = await openai.createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [{ 'role': 'user', 'content': ("Hi") }]
        })
        return true; // The API key is valid
    } catch (error) {
        return { error: { message: 'Invalid OpenAI key' } }
    }
}

module.exports.checkOpenAIKey = checkOpenAIKey;
module.exports.getOpenAI = getOpenAI; 