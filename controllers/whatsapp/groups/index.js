const { updateGroupsMetadata, getGroupsMetadata } = require('../../../db/controllers/whatsapp/groups')
const client = require('../../../whatsapp-client')


exports.getGroups = async (req, res) => {
    try {
        const groups = await getGroups()
        res.send(groups)
    } catch (err) {
        res.status(500).send(err)
    }
}

async function getGroups() {
    const groups = getGroupsMetadata()
    if (groups.length > 0) {
        const now = new Date()
        const diff = now - groups[0].lastUpdated
        if (diff > 1000 * 60 * 60 * 24) {
            const groups = await client.getParticipatingGroups()
            updateGroupsMetadata(groups)
            return groups
        } else {
            client.getParticipatingGroups().then((groups) => {
                updateGroupsMetadata(groups)
            })
            return groups
        }
    } else {
        const groups = await client.getParticipatingGroups()
        updateGroupsMetadata(groups)
        return groups
    }
}

exports.recvGroups = getGroups