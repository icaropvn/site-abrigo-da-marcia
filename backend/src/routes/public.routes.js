const express = require('express');
const { getDogsData } = require('../controllers/publicController');

const router = express.Router();

router.get('/dogs-data', getDogsData);

module.exports = router;
