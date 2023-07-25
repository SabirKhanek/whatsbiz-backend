const { getAds: getAdsFromDb, deleteAd } = require("../../db/controllers/ads/ads")
const dbImageController = require("../../db/controllers/images/index")


const getAds = (req, res) => {
    const ads = getAdsFromDb()
    res.json(ads)
}

const getAdDetails = (req, res) => {
    const id = req.query.id
    if (id) {
        let ad
        try {
            ad = getAdsFromDb(true, id)[0]
        } catch (err) {
            return res.status(404).send({ message: 'Ad not found' })
        }

        return res.json(ad)
    } else {
        const ads = getAdsFromDb(true)
        return res.json(ads)
    }
}

const deleteAdById = (req, res) => {
    try {
        const { id } = req.query
        if (!id) return res.status(400).send({ message: 'Id is required' })
        let adInDb
        try {
            adInDb = getAdsFromDb(true, id)[0]
        } catch (err) { }

        if (!adInDb) return res.status(404).send({ message: 'Ad not found' })

        if (adInDb.groups.filter(group => group.status === 'PENDING').length > 0) return res.status(400).send({ message: 'Ad is in progress' })

        try {
            if (adInDb.imageId) dbImageController.deleteImage(adInDb.imageId)
        } catch (err) {
            console.log(err)
        }

        deleteAd(id)
        res.status(200).send({ message: 'Ad deleted successfully' })
    } catch (err) {
        if (err.status) return res.status(err.status).send({ message: err.message })
        res.status(500).send(err)
    }
}

module.exports.getAds = getAds
module.exports.getAdDetails = getAdDetails
module.exports.deleteAdById = deleteAdById