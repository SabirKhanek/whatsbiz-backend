const { db } = require('../../')

const groupsMetadataInDb = () => {
    const query = `SELECT * FROM GROUPS`
    const groups = db.prepare(query).all()
    groups.forEach(group => {
        group.participants = JSON.parse(group.participants)
    })
    return groups
}

const updateGroupsMetadataInDb = (groups) => {
    const groupsInDb = groupsMetadataInDb().map(group => group.id)
    const latestGroups = groups.map(group => group.id)
    groups.forEach((group) => {
        if (!groupsInDb.includes(group.id)) {
            const query = `INSERT INTO GROUPS (id, name, description, owner, participants, lastUpdated) VALUES (?, ?, ?, ?, ?, ?)`
            const params = [group.id, group.name, group.description, group.owner, JSON.stringify(group.participants), new Date().getTime()]
            db.prepare(query).run(...params)
        } else {
            const query = `UPDATE GROUPS SET name = ?, description = ?, owner = ?, participants = ?, lastUpdated = ? WHERE id = ?`
            const params = [group.name, group.description, group.owner, JSON.stringify(group.participants), new Date().getTime(), group.id]
            db.prepare(query).run(...params)
        }
    })

    const groupsToDelete = groupsInDb.filter(group => !latestGroups.includes(group))
    groupsToDelete.forEach((groupId) => {
        console.log(groupId)
        const query = `DELETE FROM GROUPS WHERE id = ?`
        const params = [groupId]
        db.prepare(query).run(...params)
    })
}

function ifCollectionExists(collectionId) {
    const query = `SELECT * FROM GROUP_COLLECTIONS WHERE id = ?`
    const params = [collectionId]
    const collection = db.prepare(query).get(...params)
    return collection ? true : false
}

function getGroupCollection(collectionId) {
    if (!ifCollectionExists(collectionId)) {
        throw new Error(`Collection with id: ${collectionId} does not exist`)
    }
    const query = `SELECT * FROM GROUP_COLLECTIONS INNER JOIN  WHERE id = ?`
    const params = [collectionId]
    const collection = db.prepare(query).get(...params)
    collection.groups = getGroupsInCollection(collectionId)
    return collection
}

function ifCollectionWithNameExists(newName) {
    let query = `SELECT * FROM GROUP_COLLECTIONS WHERE name = ?`
    let params = [newName]
    let collection = db.prepare(query).get(...params)
    return collection ? true : false
}

function ifGroupExists(groupId) {
    const query = `SELECT * FROM GROUPS WHERE id = ?`
    const params = [groupId]
    const group = db.prepare(query).get(...params)
    return group ? true : false
}

const newCollection = (name) => {
    if (ifCollectionWithNameExists(name)) throw new Error(`Collection with name: ${name} already exists`)
    const query = `INSERT INTO GROUP_COLLECTIONS (name) VALUES (?)`
    const params = [name]
    db.prepare(query).run(...params)
    return db.prepare(`SELECT * FROM GROUP_COLLECTIONS WHERE name = ?`).get(name)
}

const addGroupToCollection = (collectionId, groupId) => {
    if (!ifGroupExists(groupId)) throw new Error(`Group with id: ${groupId} does not exist`)
    if (!ifCollectionExists(collectionId)) {
        throw new Error(`Collection with id: ${collectionId} does not exist`)
    }
    if (db.prepare(`SELECT * FROM GROUP_COLLECTIONS_GROUPS WHERE collectionId = ? AND groupId = ?`).get(collectionId, groupId)) throw new Error(`Group with id: ${groupId} already exists in collection with id: ${collectionId}`)
    const query = `INSERT INTO GROUP_COLLECTIONS_GROUPS (collectionId, groupId) VALUES (?, ?)`
    const params = [collectionId, groupId]
    db.prepare(query).run(...params)
    return db.prepare(`SELECT * FROM GROUP_COLLECTIONS_GROUPS WHERE collectionId = ? AND groupId = ?`).get(collectionId, groupId)
}

const removeGroupFromCollection = (collectionId, groupId) => {
    if (!ifCollectionExists(collectionId)) {
        throw new Error(`Collection with id: ${collectionId} does not exist`)
    }
    if (!db.prepare(`SELECT * FROM GROUP_COLLECTIONS_GROUPS WHERE collectionId = ? AND groupId = ?`).get(collectionId, groupId)) throw new Error(`Group with id: ${groupId} does not exist in collection with id: ${collectionId}`)
    const query = `DELETE FROM GROUP_COLLECTIONS_GROUPS WHERE collectionId = ? AND groupId = ?`
    const params = [collectionId, groupId]
    db.prepare(query).run(...params)
}

const deleteCollection = (collectionId) => {
    if (!ifCollectionExists(collectionId)) {
        throw new Error(`Collection with id: ${collectionId} does not exist`)
    }
    const query = `DELETE FROM GROUP_COLLECTIONS WHERE id = ?`
    const params = [collectionId]
    db.prepare(query).run(...params)
}

const getGroupCollections = () => {
    const query = `SELECT * FROM GROUP_COLLECTIONS`
    const collections = db.prepare(query).all()
    collections.forEach((collection) => {
        collection.groups = getGroupsInCollection(collection.id)
    })
    return collections
}

const getGroupsInCollection = (collectionId) => {
    if (!ifCollectionExists(collectionId)) {
        throw new Error(`Collection with id: ${collectionId} does not exist`)
    }
    const query = `SELECT * FROM GROUPS WHERE id IN (SELECT groupId FROM GROUP_COLLECTIONS_GROUPS WHERE collectionId = ?)`
    const params = [collectionId]
    const groups = db.prepare(query).all(...params)
    groups.map((group) => {
        group.participants = JSON.parse(group.participants)
        return group
    })
    return groups
}

const getGroupsNotInCollection = (collectionId) => {
    if (!ifCollectionExists(collectionId)) {
        throw new Error(`Collection with id: ${collectionId} does not exist`)
    }
    const query = `SELECT * FROM GROUPS WHERE id NOT IN (SELECT groupId FROM GROUP_COLLECTIONS_GROUPS WHERE collectionId = ?)`
    const params = [collectionId]
    const groups = db.prepare(query).all(...params)
    groups.map((group) => {
        group.participants = JSON.parse(group.participants)
        return group
    })
    return groups
}

const renameCollection = (collectionId, newName) => {
    if (!ifCollectionExists(collectionId)) {
        throw new Error(`Collection with id: ${collectionId} does not exist`)
    }
    if (ifCollectionWithNameExists(newName)) throw new Error(`Collection with name: ${newName} already exists`)
    const query = `UPDATE GROUP_COLLECTIONS SET name = ? WHERE id = ?`
    const params = [newName, collectionId]
    db.prepare(query).run(...params)
    return db.prepare(`SELECT * FROM GROUP_COLLECTIONS WHERE id = ?`).get(collectionId)
}

module.exports.newCollection = newCollection
module.exports.addGroupToCollection = addGroupToCollection
module.exports.removeGroupFromCollection = removeGroupFromCollection
module.exports.deleteCollection = deleteCollection
module.exports.getGroupCollections = getGroupCollections
module.exports.getGroupCollection = getGroupCollection
module.exports.getGroupsInCollection = getGroupsInCollection
module.exports.getGroupsNotInCollection = getGroupsNotInCollection
module.exports.getGroupsMetadata = groupsMetadataInDb
module.exports.updateGroupsMetadata = updateGroupsMetadataInDb
module.exports.renameCollection = renameCollection