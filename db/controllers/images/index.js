const { db } = require('../../')
const fs = require('fs')

const storeImagePath = (path) => {
    if (!path) throw new Error('Path is required')
    const sql = `INSERT INTO IMAGES (imagePath) VALUES (?)`
    return db.prepare(sql).run(path).lastInsertRowid
}

const deleteImage = (id) => {
    if (!id) throw new Error('Id is required')
    const path = getImagePath(id)
    const sql = `DELETE FROM IMAGES WHERE id = ?`

    db.prepare(sql).run(id)
    return deleteFile(path)
}

const deleteFile = (path) => {
    if (!path) throw new Error('Path is required')
    try { fs.unlinkSync(path); return true } catch (err) { console.log(err); return false }
}


const getImagePath = (id) => {
    if (!id) throw new Error('Id is required')
    const sql = `SELECT imagePath FROM IMAGES WHERE id = ?`
    const objInDb = db.prepare(sql).get(id)
    if (!objInDb) throw new Error('Image not found')
    return objInDb.imagePath
}

module.exports.storeImagePath = storeImagePath
module.exports.getImagePath = getImagePath
module.exports.deleteImage = deleteImage