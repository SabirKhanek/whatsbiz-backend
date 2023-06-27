const { generateProposal } = require('../utils/proposal-generator')
const { prdDetailSchema } = require('../schemas/gen-product-deal-invite')

module.exports.generateProposal = async (req, res) => {
    const validation = prdDetailSchema.validate(req.query);
    if (validation.error) {
        res.status(400).send({ result: 'error', message: validation.error.message });
        return;
    }
    try {
        const resp = await generateProposal(req.query)
        res.send({ text: resp })
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message });
    }
}