const express = require('express');
const { requireAuth } = require('../middlewares/auth');
const { listVehicles } = require('../controllers/vehicle.controller');

const router = express.Router();

router.get('/', requireAuth, listVehicles);

module.exports = router;