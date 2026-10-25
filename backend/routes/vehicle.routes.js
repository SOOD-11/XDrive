const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { listVehicles ,searchVehicles} = require('../controllers/vehicle.controller');

const router = express.Router();

router.get('/', requireAuth, listVehicles);
router.get('/search', requireAuth, searchVehicles);

module.exports = router;