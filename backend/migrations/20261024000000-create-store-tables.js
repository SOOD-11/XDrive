'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      passwordHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      role: {
        type: Sequelize.STRING(10),
        allowNull: false,
        defaultValue: 'buyer',
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('vehicles', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      maker: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      color: {
        type: Sequelize.STRING(50),
        allowNull: false,
      },
      category: {
        type: Sequelize.STRING(10),
        allowNull: false,
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('inventory', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      vehicleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        unique: true,
        references: { model: 'vehicles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      quantityAvailable: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.createTable('purchases', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      vehicleId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'vehicles', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      unitPrice: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      purchasedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

    await queryInterface.addIndex('purchases', ['userId']);
    await queryInterface.addIndex('purchases', ['vehicleId']);
    await queryInterface.addConstraint('users', {
      fields: ['role'],
      type: 'check',
      where: { role: ['buyer', 'admin'] },
      name: 'users_role_check',
    });
    await queryInterface.addConstraint('vehicles', {
      fields: ['category'],
      type: 'check',
      where: { category: ['muv', 'suv', 'sedan'] },
      name: 'vehicles_category_check',
    });
    await queryInterface.addConstraint('vehicles', {
      fields: ['price'],
      type: 'check',
      where: { price: { [Sequelize.Op.gte]: 0 } },
      name: 'vehicles_price_nonnegative_check',
    });
    await queryInterface.addConstraint('inventory', {
      fields: ['quantityAvailable'],
      type: 'check',
      where: { quantityAvailable: { [Sequelize.Op.gte]: 0 } },
      name: 'inventory_quantity_nonnegative_check',
    });
    await queryInterface.addConstraint('purchases', {
      fields: ['quantity'],
      type: 'check',
      where: { quantity: { [Sequelize.Op.gt]: 0 } },
      name: 'purchases_quantity_positive_check',
    });
    await queryInterface.addConstraint('purchases', {
      fields: ['unitPrice'],
      type: 'check',
      where: { unitPrice: { [Sequelize.Op.gte]: 0 } },
      name: 'purchases_unit_price_nonnegative_check',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('purchases');
    await queryInterface.dropTable('inventory');
    await queryInterface.dropTable('vehicles');
    await queryInterface.dropTable('users');
  },
};
