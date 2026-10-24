const { Vehicle, Inventory } = require('../models');

async function listVehicles(_req, res) {
  try {
    const rows = await Vehicle.findAll({
      include: [{
        model: Inventory,
        as: 'inventory',
        attributes: ['quantityAvailable'],
        required: false,
      }],
      order: [['id', 'ASC']],
    });

    const vehicles = rows.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      maker: vehicle.maker,
      color: vehicle.color,
      category: vehicle.category,
      price: vehicle.price,
      vehicleUrl: vehicle.vehicleUrl,
      quantityAvailable: vehicle.inventory?.quantityAvailable ?? 0,
    }));

    return res.json({ vehicles });
  } catch (error) {
    console.error('Could not list vehicles:', error);
    return res.status(500).json({ error: 'Could not load vehicles' });
  }
}

module.exports = { listVehicles };