module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Inventory',
    {
      vehicleId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
      quantityAvailable: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
        validate: {
          min: 0,
        },
      },
    },
    {
      tableName: 'inventory',
    },
  );
