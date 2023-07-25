const { db } = require('../../')
const { getGroupsMetadata } = require('../whatsapp/groups')

const getAds = (detailed = false, id) => {
    const query = `SELECT * FROM AD_LISTING ${id ? `WHERE id = ${id}` : ''}`
    const ads = db.prepare(query).all()
    if (id && ads.length === 0) throw new Error('Ad not found')
    if (!detailed) return ads
    ads.forEach(ad => {
        ad.groups = []
        const queryGroups = `SELECT * FROM AD_LISTING_GROUP WHERE adListingId = ?`
        const groups = db.prepare(queryGroups).all(ad.id)
        const groupsInDb = getGroupsMetadata()
        groups.forEach(group => {
            const groupInDb = groupsInDb.find(g => g.id === group.groupId)
            if (groupInDb) ad.groups.push({ group: groupInDb, status: group.status })
        })
    })
    return ads
}


const insertAd = (imageId, adText) => {
    const query = `INSERT INTO AD_LISTING (imageId, adText, postedAt) VALUES (?, ?, ?)`
    const params = [imageId, adText, new Date().getTime()]
    return db.prepare(query).run(...params).lastInsertRowid
}

const insertAdRecipient = (adId, groupId) => {
    const query = `INSERT INTO AD_LISTING_GROUP (adListingId, groupId) VALUES (?, ?)`
    const params = [adId, groupId]
    db.prepare(query).run(...params)
}

const updateAdRecipient = (adId, groupId, status) => {
    const query = `UPDATE AD_LISTING_GROUP SET status = ? WHERE adListingId = ? AND groupId = ?`
    const params = [status, adId, groupId]
    db.prepare(query).run(...params)
}

const deleteAd = (id) => {
    const query = `DELETE FROM AD_LISTING WHERE id = ?`
    const params = [id]
    db.prepare(query).run(...params)
}

const setPendingToFailed = () => {
    const query = `UPDATE AD_LISTING_GROUP SET status = 'FAILED' WHERE status = 'PENDING'`
    db.prepare(query).run()
}

module.exports.insertAd = insertAd
module.exports.insertAdRecipient = insertAdRecipient
module.exports.updateAdRecipient = updateAdRecipient
module.exports.getAds = getAds
module.exports.deleteAd = deleteAd
module.exports.setPendingToFailed = setPendingToFailed