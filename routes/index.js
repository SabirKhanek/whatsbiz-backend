const express = require('express');
const router = express.Router();
const controller = require('../controllers');
const authController = require('../controllers/auth-controller');

router.use('/data', authController.validateToken, require('./api_data'));
router.use('/config', authController.validateToken, require('./api_config'))

router.get('/is-wa-connected', controller.isWAConnected)

router.post('/restart-wa', controller.restartWA)

router.post('/send-message', controller.sendMessage)

router.post('/logout', controller.logoutWA)

module.exports = router;