const express = require('express');
const router = express.Router();
const controller = require('../controllers/db-controller');

router.get('/', (req, res) => {
    res.send('api data works')
})

router.get('/get_products_excel', controller.getExcelPath)
router.get('/get_products', controller.getProducts)


module.exports = router;