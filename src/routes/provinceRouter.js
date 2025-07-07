// File: /src/routes/provinceRouter.js
const express = require('express');
const router = express.Router();
const { getProvinces, getDistricts, getWards } = require('../controllers/provinceController');

router.get('/', getProvinces);
router.get('/districts/:provinceId', getDistricts);
router.get('/wards/:districtId', getWards);

module.exports = router;