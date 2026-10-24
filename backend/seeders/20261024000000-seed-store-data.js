'use strict';

const { randomBytes, scryptSync } = require('node:crypto');

const buyerUsername = 'seed_buyer';
const adminUsername = 'seed_admin';
const vehicleSpecs = [
  {
    name: 'Sample Family Sedan',
    maker: 'Xtreme Motors',
    color: 'Silver',
    category: 'sedan',
    price: '24500.00',
    quantityAvailable: 8,
  },
  {
    name: 'Sample City SUV',
    maker: 'Ninja Motors',
    color: 'Blue',
    category: 'suv',
    price: '32900.00',
    quantityAvailable: 5,
  },
  {
    name: 'Sample Utility MUV',
    maker: ' Esteem Motors',
    color: 'White',
    category: 'muv',
    price: '28750.00',
    quantityAvailable: 3,
  },
];

function createPasswordHash(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

module.exports = {
  async up() {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Refusing to insert sample data in production');
    }

    const buyerPassword = "123445";
    const adminPassword = "123445";
    if (
      !buyerPassword ||
      !adminPassword ||
      buyerPassword.startsWith('replace_with_') ||
      adminPassword.startsWith('replace_with_')
    ) {
      throw new Error(
        'Set SEED_BUYER_PASSWORD and SEED_ADMIN_PASSWORD in .env before creating sample users',
      );
    }

    const {
      User,
      Vehicle,
      Inventory,
      Purchase,
      sequelize,
    } = require('../models');

    await sequelize.transaction(async (transaction) => {
      const [buyer] = await User.findOrCreate({
        where: { username: buyerUsername },
        defaults: {
          passwordHash: createPasswordHash(buyerPassword),
          role: 'buyer',
        },
        transaction,
      });
      await User.findOrCreate({
        where: { username: adminUsername },
        defaults: {
          passwordHash: createPasswordHash(adminPassword),
          role: 'admin',
        },
        transaction,
      });

      const vehicles = [];
      for (const spec of vehicleSpecs) {
        const [vehicle] = await Vehicle.findOrCreate({
          where: { name: spec.name, maker: spec.maker },
          defaults: {
            name: spec.name,
            maker: spec.maker,
            color: spec.color,
            category: spec.category,
            price: spec.price,
          },
          transaction,
        });
        vehicles.push(vehicle);

        await Inventory.findOrCreate({
          where: { vehicleId: vehicle.id },
          defaults: {
            vehicleId: vehicle.id,
            quantityAvailable: spec.quantityAvailable,
          },
          transaction,
        });
      }

    
    });
  },

  async down() {
    const { User, Vehicle, Inventory, Purchase, sequelize } = require('../models');

    await sequelize.transaction(async (transaction) => {
      const [buyer, admin] = await Promise.all([
        User.findOne({ where: { username: buyerUsername }, transaction }),
        User.findOne({ where: { username: adminUsername }, transaction }),
      ]);
      const vehicles = await Vehicle.findAll({
        where: {
          name: vehicleSpecs.map((vehicle) => vehicle.name),
          maker: 'Example Motors',
        },
        transaction,
      });
      const userIds = [buyer, admin].filter(Boolean).map((user) => user.id);
      const vehicleIds = vehicles.map((vehicle) => vehicle.id);

      if (userIds.length && vehicleIds.length) {
        await Purchase.destroy({
          where: { userId: userIds, vehicleId: vehicleIds },
          transaction,
        });
      }
      if (vehicleIds.length) {
        await Inventory.destroy({
          where: { vehicleId: vehicleIds },
          transaction,
        });
        await Vehicle.destroy({ where: { id: vehicleIds }, transaction });
      }
      if (userIds.length) {
        await User.destroy({ where: { id: userIds }, transaction });
      }
    });
  },
};
