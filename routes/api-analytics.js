const express = require('express');
const router = express.Router();
const controller = require('../controllers/analytics-controller');

router.get('/product-buy-sell', controller.getProductBuySellAnalytics)

module.exports = router;