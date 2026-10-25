'use strict';

const { Vehicle } = require('../models');
const imageService = require('../services/image.service');

async function uploadVehicleImage(req, res) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  if (!req.file) {
    return res.status(400).json({ error: 'Image is required' });
  }

  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    const imageUrl = await imageService.uploadVehicleImage(req.file.buffer);
    await vehicle.update({ vehicleUrl: imageUrl });

    return res.json({
      vehicle: {
        id: vehicle.id,
        vehicleUrl: vehicle.vehicleUrl,
      },
    });
  } catch (error) {
    console.error('Could not upload vehicle image:', error);
    return res.status(500).json({ error: 'Could not upload image' });
  }
}

module.exports = { uploadVehicleImage };