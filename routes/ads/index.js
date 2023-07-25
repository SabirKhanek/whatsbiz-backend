const express = require('express');
const router = express.Router();
const controller = require('../../controllers/ads')

router.get('/', controller.getAds)
router.get('/details', controller.getAdDetails)
router.delete('/', controller.deleteAdById)

module.exports = router;