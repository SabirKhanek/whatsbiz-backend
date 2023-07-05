const schema = require('./data_schema').data_schema;


function getIntentAnalysisCommand(message) {
    message = "Text: \n\"" + message + "\"\n";

    const instructions = `Extract relevant information from the text input for buying or selling products and return the result in JSON format following the given schema. The extracted information should include intent, product name, product type, RAM capacity, storage capacity, color, processor, quantity, condition, price, and specified qualities.
    You must follow this JSON SCHEMA:\n${JSON.stringify(schema)}`;

    return message.concat(instructions);
}

function getProductSupportingInfo(prdinfo) {
    let info = ''
    for (let key of ['ram', 'storage', 'color', 'remarks']) {
        if (prdinfo[key] && typeof prdinfo[key] === 'string' && prdinfo[key].trim() !== '-') {
            info += `${key}: ${prdinfo[key]} `;
        }
    }
    return info
}

function getDealProposalInitCommand(prdinfo) {
    let message = `Product: ${prdinfo.name} and ${getProductSupportingInfo(prdinfo)}`;


    const instructions = `The product detail is listed for ${prdinfo.intent}. Generate a text letting customer know that you have the product in stock or you want to buy based on the listing intent and you are up for discussion. Dont mention names just to the point and informal text`;

    return message.concat(instructions);
}
// getDealProposalInitCommand({
//     "intent": "buy",
//     "product": "iphone xr",
//     "ram": "4gb",
//     "storage": "64gb",
//     "color": "black"
// })

module.exports.getIntentAnalysisCmd = getIntentAnalysisCommand
module.exports.getDealProposalInitCmd = getDealProposalInitCommand
