const { getOpenAI } = require('./openai');
const { getDealProposalInitCmd } = require('./prompts');

async function generateProposal(request) {
    request = getDealProposalInitCmd(request)
    request = { "role": "user", "content": request }
    try {
        const resp = await getOpenAI().createChatCompletion({
            model: "gpt-3.5-turbo",
            messages: [request]
        })

        if (resp.data.choices[0].message.content) {
            txt = resp.data.choices[0].message.content
            return txt
        } else {
            return resp.message
        }
    }
    catch (err) {
        throw "SERVER_ERROR " + err.message
    }
}

// generateProposal("I want to buy a 14 pro max").then((resp) => console.log(resp))

module.exports.generateProposal = generateProposal