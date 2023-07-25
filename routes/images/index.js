const express = require('express');
const router = express.Router();
const controller = require('../../controllers/images');

router.get('/:id', controller.getImage);
router.delete('/', controller.deleteImage)

module.exports = router;