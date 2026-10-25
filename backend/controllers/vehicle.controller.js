'use strict';

const { Op } = require('sequelize');
//const { Vehicle, Inventory } = require('../models');
const { Vehicle, Inventory, sequelize } = require('../models');
function toVehicleResponse(vehicle) {
  return {
    id: vehicle.id,
    name: vehicle.name,
    maker: vehicle.maker,
    color: vehicle.color,
    category: vehicle.category,
    price: vehicle.price,
    vehicleUrl: vehicle.vehicleUrl,
    quantityAvailable: vehicle.inventory?.quantityAvailable ?? 0,
  };
}

async function findVehicles(where = {}) {
  return Vehicle.findAll({
    where,
    include: [{
      model: Inventory,
      as: 'inventory',
      attributes: ['quantityAvailable'],
      required: false,
    }],
    order: [['id', 'ASC']],
  });
}

async function listVehicles(_req, res) {
  try {
    const vehicles = await findVehicles();
    return res.json({ vehicles: vehicles.map(toVehicleResponse) });
  } catch (error) {
    console.error('Could not list vehicles:', error);
    return res.status(500).json({ error: 'Could not load vehicles' });
  }
}

async function searchVehicles(req, res) {
  const { maker, name, category, minPrice, maxPrice } = req.query;
  const where = {};

  if (typeof maker === 'string' && maker.trim()) {
    where.maker = { [Op.like]: `%${maker.trim()}%` };
  }

  if (typeof name === 'string' && name.trim()) {
    where.name = { [Op.like]: `%${name.trim()}%` };
  }

  if (typeof category === 'string' && category.trim()) {
    where.category = category.trim();
  }

  const minimum = minPrice === undefined ? null : Number(minPrice);
  const maximum = maxPrice === undefined ? null : Number(maxPrice);

  if (
    (minimum !== null && (!Number.isFinite(minimum) || minimum < 0)) ||
    (maximum !== null && (!Number.isFinite(maximum) || maximum < 0)) ||
    (minimum !== null && maximum !== null && minimum > maximum)
  ) {
    return res.status(400).json({ error: 'Invalid price range' });
  }

  if (minimum !== null || maximum !== null) {
    where.price = {};
    if (minimum !== null) where.price[Op.gte] = minimum;
    if (maximum !== null) where.price[Op.lte] = maximum;
  }

  try {
    const vehicles = await findVehicles(where);
    return res.json({ vehicles: vehicles.map(toVehicleResponse) });
  } catch (error) {
    console.error('Could not search vehicles:', error);
    return res.status(500).json({ error: 'Could not search vehicles' });
  }
}
async function createVehicle(req, res) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const {
    name,
    maker,
    color,
    category,
    price,
    quantityAvailable,
  } = req.body;

  if (
    !name?.trim() ||
    !maker?.trim() ||
    !color?.trim() ||
    !['sedan', 'suv', 'muv'].includes(category) ||
    price === undefined ||
    price === null ||
    price === '' ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0 ||
    !Number.isInteger(quantityAvailable) ||
    quantityAvailable < 0
  ) {
    return res.status(400).json({ error: 'Invalid vehicle details' });
  }

  try {
    const vehicle = await sequelize.transaction(async (transaction) => {
      const newVehicle = await Vehicle.create({
        name: name.trim(),
        maker: maker.trim(),
        color: color.trim(),
        category,
        price,
      }, { transaction });

      await Inventory.create({
        vehicleId: newVehicle.id,
        quantityAvailable,
      }, { transaction });

      return newVehicle;
    });

    return res.status(201).json({
      vehicle: {
        id: vehicle.id,
        name: vehicle.name,
        maker: vehicle.maker,
        color: vehicle.color,
        category: vehicle.category,
        price: vehicle.price,
        vehicleUrl: vehicle.vehicleUrl,
        quantityAvailable,
      },
    });
  } catch (error) {
    console.error('Could not create vehicle:', error);
    return res.status(500).json({ error: 'Could not create vehicle' });
  }
}
module.exports = { listVehicles, searchVehicles, createVehicle };