const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { listVehicles ,searchVehicles,createVehicle} = require('../controllers/vehicle.controller');

const router = express.Router();

router.get('/', requireAuth, listVehicles);
router.get('/search', requireAuth, searchVehicles);
router.post('/', requireAuth, createVehicle);
module.exports = router;