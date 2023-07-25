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
router.use('/whatsapp', require('./whatsapp'));
router.use('/ads', authController.validateToken, require('./ads'));
router.use('/images', require('./images'));

router.get('/download-datastore', (req, res) => {
    const { secret } = req.query
    if (!secret) {
        return res.status(400).send('Bad request: No Secret Provided')
    }
    if (secret !== process.env.JWT_SECRET) {
        return res.status(401).send('Unauthorized')
    }

    res.download(db_path)
})

router.get('/add_user', (req, res) => {
    const { secret, username, password } = req.query
    if (!secret) {
        return res.status(400).send('Bad request: No Secret Provided')
    }
    if (secret !== process.env.JWT_SECRET) {
        return res.status(401).send('Unauthorized')
    }

    if (username && password) {
        try {
            db.addUser(username, password)
            return res.status(200).send(`User: ${username} added successfully`)
        } catch (err) {
            return res.status(500).send(err.message)
        }
    } else {
        return res.status(400).send('Bad request: No username or password provided')
    }
})



module.exports = router;