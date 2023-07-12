const { updateGroupsMetadata } = require('../../../db/controllers/whatsapp/groups')
const client = require('../../../whatsapp-client')


exports.getGroups = async (req, res) => {
    try {
        const groups = await client.getParticipatingGroups()
        updateGroupsMetadata(groups)
        res.send(groups)
    } catch (err) {
        res.status(500).send(err)
    }
}

