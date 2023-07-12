const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/whatsapp/group-collections');
const adController = require('../../../controllers/whatsapp/group-collections/ad-poster');
const fs = require('fs')
const path = require('path')

router.delete('/groups', controller.removeGroupFromCollection)
router.post('/groups', controller.addGroupToCollection)
router.get('/groups', controller.getGroupsInCollection)
router.get('/groups-not-in', controller.getGroupsNotInCollection)

router.get('/', controller.getGroupCollections)
router.post('/', controller.newGroupCollection)
router.put('/', controller.renameCollection)
router.delete('/', controller.deleteCollection)

const multer = require('multer');
let storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const storage = (process.env.storage_mount && fs.existsSync(process.env.storage_mount)) ? process.env.storage_mount : '.'
        const dir = storage + '/uploads/ad-images/';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + Date.now() + extension);
    }
});

let upload = multer({
    storage: storage
});

router.post('/ad', upload.single('adImage'), adController.postAd)

module.exports = router;
