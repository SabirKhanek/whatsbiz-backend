const express = require('express');
const router = express.Router();
const controller = require('../controllers/auth-controller');

router.post('/', controller.authenticate);

router.post('/validate', controller.validateToken, (req, res) => { res.send({ result: 'ok' }) });

module.exports = router;