const joi = require('joi');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const waClient = require('../../../whatsapp-client');
const dbController = require('../../../db/controllers/whatsapp/groups')
const { forEach } = require('p-iteration')

exports.postAd = async (req, res) => {
    if (req.file?.path) {
        req.body.adImage = req.file.path;
    }

    req.body.collectionIds = JSON.parse(req.body.collectionIds);
    const schema = joi.object({
        adText: joi.string().trim().min(3).required(),
        adImage: joi.string(),
        collectionIds: joi.array().items(joi.number()).required()
    })

    const { error, value } = schema.validate(req.body);

    if (error) return res.status(400).json({ error: error.details[0].message });

    if (!waClient.isWAConnected()) return res.status(500).send({ error: 'Whatsapp is not connected' })

    const { adText, adImage, collectionIds } = req.body;

    // Refresh groups metadata
    try {
        const groups = await waClient.getParticipatingGroups()
        dbController.updateGroupsMetadata(groups)
    } catch (err) {
        console.log(err)
        return res.status(500).send({ error: err })
    }

    // Get groups in collections
    const groupIds = []

    collectionIds.forEach(collectionId => {
        try {
            const groupsInCollection = dbController.getGroupsInCollection(collectionId)
            groupsInCollection.forEach(group => {
                groupIds.find(groupId => groupId === group.id) || groupIds.push(group.id)
            })
        } catch (err) { }
    })

    const groupTextStatus = {}

    res.json({ message: 'messages are being sent' })

    for (let groupId of groupIds) {
        try {
            if (adImage) {
                await waClient.sendImageMessage(groupId, adImage, adText)
            } else {
                await waClient.sendTextMessage(groupId, adText)
            }
            groupTextStatus[groupId] = 'success'
            await new Promise(resolve => setTimeout(resolve, 2000))
        } catch (err) {
            groupTextStatus[groupId] = 'failed'
        }
    }

    console.log(groupTextStatus)
}