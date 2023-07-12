const { addGroupToCollection, deleteCollection, getGroupCollections, getGroupsInCollection, getGroupsNotInCollection, newCollection, removeGroupFromCollection, renameCollection, getGroupCollection } = require('../../../db/controllers/whatsapp/groups')
const joi = require('joi')
const { recvGroups } = require('../groups')

exports.newGroupCollection = (req, res) => {
    const { name } = req.body
    if (!name) return res.status(400).send({ result: 'error', message: 'No group name provided' })
    try {
        const collection = newCollection(name)
        res.send(collection)
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message })
    }
}

exports.addGroupToCollection = async (req, res) => {
    const schema = joi.object({
        collectionId: joi.number().required(),
        groupIds: joi.array().items(joi.string()).required()
    })
    const { error } = schema.validate(req.body)
    if (error) return res.status(400).send({ result: 'error', message: error.message })
    const { collectionId, groupIds } = req.body
    const completionStatuses = {}

    groupIds.forEach((groupId) => {
        try {
            const groupInCollection = addGroupToCollection(collectionId, groupId)
            completionStatuses[groupId] = groupInCollection
        } catch (err) {
            completionStatuses[groupId] = err.message
        }
    })

    res.send(completionStatuses)
}

exports.getGroupCollections = (req, res) => {
    const { collectionId } = req.query
    try {
        if (collectionId) {
            const collection = getGroupCollection(collectionId)
            return res.send(collection)
        }
        const collections = getGroupCollections()
        return res.send(collections)
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message })
    }
}


exports.getGroupsInCollection = async (req, res) => {
    const { collectionId } = req.query
    if (!collectionId) return res.status(400).send({ result: 'error', message: 'No collection id provided' })
    try {
        const groups = getGroupsInCollection(collectionId)
        res.send(groups)
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message })
    }
}

exports.getGroupsNotInCollection = async (req, res) => {
    const { collectionId } = req.query
    if (!collectionId) return res.status(400).send({ result: 'error', message: 'No collection id provided' })
    try {
        const refreshGroup = await recvGroups()
        const groups = getGroupsNotInCollection(collectionId)
        res.send(groups)
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message })
    }
}

exports.renameCollection = (req, res) => {
    const { collectionId, newName } = req.body
    if (!collectionId) return res.status(400).send({ result: 'error', message: 'No collection id provided' })
    if (!newName) return res.status(400).send({ result: 'error', message: 'No new name provided' })
    try {
        const newCollection = renameCollection(collectionId, newName)
        res.send(newCollection)
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message })
    }
}

exports.removeGroupFromCollection = (req, res) => {
    const { collectionId, groupId } = req.query
    if (!collectionId) return res.status(400).send({ result: 'error', message: 'No collection id provided' })
    if (!groupId) return res.status(400).send({ result: 'error', message: 'No group id provided' })
    try {
        removeGroupFromCollection(collectionId, groupId)
        res.send({ result: 'ok' })
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message })
    }
}

exports.deleteCollection = (req, res) => {
    const { collectionId } = req.query
    if (!collectionId) return res.status(400).send({ result: 'error', message: 'No collection id provided' })
    try {
        deleteCollection(collectionId)
        res.send({ result: 'ok' })
    } catch (err) {
        res.status(500).send({ result: 'error', message: err.message })
    }
}