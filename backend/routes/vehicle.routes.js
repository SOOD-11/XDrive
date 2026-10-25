const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { listVehicles ,searchVehicles,createVehicle,updateVehicle,deleteVehicle} = require('../controllers/vehicle.controller');
const { purchaseVehicle } = require('../controllers/purchase.controller');

const router = express.Router();

router.get('/', requireAuth, listVehicles);
router.get('/search', requireAuth, searchVehicles);
router.post('/', requireAuth, createVehicle);
router.put('/:id', requireAuth, updateVehicle);
router.delete('/:id', requireAuth, deleteVehicle);
router.post('/:id/purchase', requireAuth, purchaseVehicle);
module.exports = router;