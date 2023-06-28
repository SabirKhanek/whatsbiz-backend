const express = require('express');
const router = express.Router();
const controller = require('../controllers');
const authController = require('../controllers/auth-controller');
const { db_path } = require('../db');
const db = require('../db/dbHandler')

router.use('/data', authController.validateToken, require('./api_data'));
router.use('/config', authController.validateToken, require('./api_config'))
router.use('/auth', require('./auth'));
router.use('/ai', authController.validateToken, require('./api_ai'));
router.use('/analytics', authController.validateToken, require('./api-analytics'));

router.get('/download-datastore', (req, res) => {
    if (!req.params.secret) {
        return res.status(400).send('Bad request: No Secret Provided')
    }
    if (req.params.secret !== process.env.JWT_SECRET) {
        return res.status(401).send('Unauthorized')
    }

    res.download(db_path)
})

router.get('/add_user', (req, res) => {
    if (!req.params.secret) {
        return res.status(400).send('Bad request: No Secret Provided')
    }
    if (req.params.secret !== process.env.JWT_SECRET) {
        return res.status(401).send('Unauthorized')
    }

    if (req.params.username && req.params.password) {
        try {
            db.addUser(req.params.username, req.params.password)
            return res.status(200).send(`User: ${req.params.username} added successfully`)
        } catch (err) {
            return res.status(500).send(err.message)
        }
    } else {
        return res.status(400).send('Bad request: No username or password provided')
    }
})

router.get('/is-wa-connected', controller.isWAConnected)

router.post('/restart-wa', controller.restartWA)

router.post('/send-message', controller.sendMessage)

router.post('/logout', controller.logoutWA)

module.exports = router;