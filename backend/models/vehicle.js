module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'Vehicle',
    {
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      maker: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      color: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      category: {
        type: DataTypes.STRING(10),
        allowNull: false,
        validate: {
          isIn: [['muv', 'suv', 'sedan']],
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        validate: {
          min: 0,
        },
      },
      vehicleUrl: {
        type: DataTypes.STRING(2048),
        allowNull: true,
        validate: {
          isUrl: true,
        },
      },
    },
    {
      tableName: 'vehicles',
    },
  );
