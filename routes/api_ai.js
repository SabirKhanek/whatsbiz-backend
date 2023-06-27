const express = require('express');
const router = express.Router();
const controller = require('../controllers/ai-controller');


router.get('/generate-proposal', controller.generateProposal)

module.exports = router;