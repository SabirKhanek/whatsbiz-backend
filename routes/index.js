const express = require('express');
const router = express.Router();
const controller = require('../controllers');

router.get('/', (req, res) => {
    res.send('api works')
})

router.get('/is-wa-connected', controller.isWAConnected)

router.post('/restart-wa', controller.restartWA)

router.post('/send-message', controller.sendMessage)

router.post('/logout', controller.logoutWA)

module.exports = router;