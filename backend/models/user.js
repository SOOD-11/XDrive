module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'User',
    {
      username: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
          len: [3, 50],
        },
      },
      passwordHash: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING(10),
        allowNull: false,
        defaultValue: 'buyer',
        validate: {
          isIn: [['buyer', 'admin']],
        },
      },
    },
    {
      tableName: 'users',
    },
  );