const express = require('express');
const router = express.Router();
const controller = require('../../../controllers/whatsapp/groups');

router.get('/', controller.getGroups)

module.exports = router;