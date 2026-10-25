'use strict';

const { literal } = require('sequelize');
const { Vehicle, Inventory } = require('../models');

async function restockVehicle(req, res) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const quantity = req.body?.quantity;

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    const vehicle = await Vehicle.findByPk(req.params.id);

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Increment in SQL so simultaneous restocks do not overwrite each other.
    const [updatedCount] = await Inventory.update(
      {
        quantityAvailable: literal(`quantityAvailable + ${quantity}`),
      },
      {
        where: { vehicleId: vehicle.id },
      },
    );

    if (updatedCount === 0) {
      return res.status(404).json({ error: 'Inventory not found' });
    }

    const inventory = await Inventory.findOne({
      where: { vehicleId: vehicle.id },
    });

    return res.json({
      vehicleId: vehicle.id,
      quantityAvailable: inventory.quantityAvailable,
    });
  } catch (error) {
    console.error('Could not restock vehicle:', error);
    return res.status(500).json({ error: 'Could not restock vehicle' });
  }
}

module.exports = { restockVehicle };