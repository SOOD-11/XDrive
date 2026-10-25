'use strict';

const { Op, literal } = require('sequelize');
const { sequelize, Vehicle, Inventory, Purchase } = require('../models');

async function purchaseVehicle(req, res) {
  const quantity = req.body?.quantity ?? 1;

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ error: 'Quantity must be a positive integer' });
  }

  try {
    const result = await sequelize.transaction(async (transaction) => {
      const vehicle = await Vehicle.findByPk(req.params.id, { transaction });

      if (!vehicle) {
        return { status: 404 };
      }

      // The condition and decrement happen in one SQL UPDATE.
      // Only one request can claim the final unit of stock.
      const [updatedCount] = await Inventory.update(
        {
          quantityAvailable: literal(`quantityAvailable - ${quantity}`),
        },
        {
          where: {
            vehicleId: vehicle.id,
            quantityAvailable: { [Op.gte]: quantity },
          },
          transaction,
        },
      );

      if (updatedCount === 0) {
        return { status: 409 };
      }

      const purchase = await Purchase.create({
        userId: req.user.id,
        vehicleId: vehicle.id,
        quantity,
        unitPrice: vehicle.price,
        purchasedAt: new Date(),
      }, { transaction });

      const inventory = await Inventory.findOne({
        where: { vehicleId: vehicle.id },
        transaction,
      });

      return {
        status: 201,
        purchase,
        quantityAvailable: inventory.quantityAvailable,
      };
    });

    if (result.status === 404) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    if (result.status === 409) {
      return res.status(409).json({ error: 'Not enough stock' });
    }

    return res.status(201).json({
      purchase: {
        vehicleId: result.purchase.vehicleId,
        quantity: result.purchase.quantity,
        unitPrice: result.purchase.unitPrice,
      },
      quantityAvailable: result.quantityAvailable,
    });
  } catch (error) {
    console.error('Could not purchase vehicle:', error);
    return res.status(500).json({ error: 'Could not purchase vehicle' });
  }
}

module.exports = { purchaseVehicle };