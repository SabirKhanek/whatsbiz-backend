const express = require('express')
const router = express.Router()
const controller = require('../controllers/config-controller')

router.get('/', controller.getConfig)

router.post('/save', controller.saveConfig)

module.exports = router
