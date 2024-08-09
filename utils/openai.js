const { Configuration, OpenAIApi } = require("openai");
const { config } = require("../db/dbHandler");

const getOpenAI = () => {
  const configuration = new Configuration({
    apiKey: config.get("openai_key"),
    organization: "org-Mdy3lIIo0OzfH05zx3DYn6BS",
  });
  return new OpenAIApi(configuration);
};

async function checkOpenAIKey(apiKey) {
  try {
    console.log(process.env.openai_org_id, apiKey);
    const configuration = new Configuration({
      organization: "org-Mdy3lIIo0OzfH05zx3DYn6BS",
      apiKey: apiKey,
    });
    const openai = new OpenAIApi(configuration);
    const response = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: "Hi" }],
    });
    console.log(response.data);
    return true; // The API key is valid
  } catch (error) {
    console.log(error.message);
    return { error: { message: "Invalid OpenAI key" } };
  }
}

module.exports.checkOpenAIKey = checkOpenAIKey;
module.exports.getOpenAI = getOpenAI;
