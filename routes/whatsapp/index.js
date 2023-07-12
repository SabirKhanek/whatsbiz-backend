const express = require('express');
const router = express.Router();
const controller = require('../../controllers/whatsapp');

router.use('/groups', require('./groups'));
router.use('/group-collections', require('./group-collections'));

router.get('/is-wa-connected', controller.isWAConnected)

router.post('/restart-wa', controller.restartWA)

router.post('/send-message', controller.sendMessage)

router.post('/logout', controller.logoutWA)

module.exports = router;