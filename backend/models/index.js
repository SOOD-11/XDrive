const { Sequelize } = require('sequelize');
const config = require('../config/config');

const environment = process.env.NODE_ENV || 'development';
const environmentConfig = config[environment];

if (!environmentConfig) {
  throw new Error(`Unsupported NODE_ENV "${environment}"`);
}

const databaseUrl = process.env[environmentConfig.use_env_variable];

if (!databaseUrl) {
  throw new Error(
    `${environmentConfig.use_env_variable} must be set to connect to MySQL`,
  );
}

const sequelize = new Sequelize(databaseUrl, {
  dialect: environmentConfig.dialect,
  logging: environmentConfig.logging,
});

const db = { sequelize, Sequelize };

db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Vehicle = require('./vehicle')(sequelize, Sequelize.DataTypes);
db.Purchase = require('./purchase')(sequelize, Sequelize.DataTypes);
db.Inventory = require('./inventory')(sequelize, Sequelize.DataTypes);

db.User.hasMany(db.Purchase, { as: 'purchases', foreignKey: 'userId' });
db.Purchase.belongsTo(db.User, { as: 'user', foreignKey: 'userId' });
db.Vehicle.hasMany(db.Purchase, { as: 'purchases', foreignKey: 'vehicleId' });
db.Purchase.belongsTo(db.Vehicle, { as: 'vehicle', foreignKey: 'vehicleId' });
db.Vehicle.hasOne(db.Inventory, { as: 'inventory', foreignKey: 'vehicleId' });
db.Inventory.belongsTo(db.Vehicle, { as: 'vehicle', foreignKey: 'vehicleId' });

db.User.belongsToMany(db.Vehicle, {
  as: 'purchasedVehicles',
  through: db.Purchase,
  foreignKey: 'userId',
  otherKey: 'vehicleId',
});
db.Vehicle.belongsToMany(db.User, {
  as: 'buyers',
  through: db.Purchase,
  foreignKey: 'vehicleId',
  otherKey: 'userId',
});

module.exports = db;
