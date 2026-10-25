const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { listVehicles ,searchVehicles,createVehicle,updateVehicle} = require('../controllers/vehicle.controller');

const router = express.Router();

router.get('/', requireAuth, listVehicles);
router.get('/search', requireAuth, searchVehicles);
router.post('/', requireAuth, createVehicle);
router.put('/:id', requireAuth, updateVehicle);
module.exports = router;