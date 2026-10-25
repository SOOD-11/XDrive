'use strict';

const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const request = require('supertest');

const app = require('../index');
const { sequelize, Vehicle, Inventory } = require('../models');

const vehicleName = `Test Hatchback ${randomUUID()}`;
const invalidVehicleName = `Invalid Hatchback ${randomUUID()}`;

async function loginAs(username, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body.token;
}

after(async () => {
  // Remove any cars these tests managed to create.
  for (const name of [vehicleName, invalidVehicleName]) {
    const vehicle = await Vehicle.findOne({ where: { name } });

    if (vehicle) {
      await Inventory.destroy({ where: { vehicleId: vehicle.id } });
      await vehicle.destroy();
    }
  }

  await sequelize.close();
});

test('admin can add a vehicle with starting stock', async () => {
  const token = await loginAs('seed_admin', process.env.SEED_ADMIN_PASSWORD);

  const response = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: vehicleName,
      maker: 'Test Motors',
      color: 'Red',
      category: 'sedan',
      price: '35000.00',
      quantityAvailable: 4,
    });

  assert.equal(response.status, 201, JSON.stringify(response.body));
  assert.equal(response.body.vehicle.name, vehicleName);
  assert.equal(response.body.vehicle.quantityAvailable, 4);

  const savedVehicle = await Vehicle.findOne({
    where: { name: vehicleName },
  });
  assert.ok(savedVehicle);

  const stock = await Inventory.findOne({
    where: { vehicleId: savedVehicle.id },
  });
  assert.equal(stock.quantityAvailable, 4);
});

test('buyer cannot add a vehicle', async () => {
  const token = await loginAs('seed_buyer', process.env.SEED_BUYER_PASSWORD);

  const response = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: vehicleName,
      maker: 'Test Motors',
      color: 'Red',
      category: 'sedan',
      price: '35000.00',
      quantityAvailable: 4,
    });

  assert.equal(response.status, 403);
});

test('vehicle creation requires a token', async () => {
  const response = await request(app)
    .post('/api/vehicles')
    .send({
      name: vehicleName,
      maker: 'Test Motors',
      color: 'Red',
      category: 'sedan',
      price: '35000.00',
      quantityAvailable: 4,
    });

  assert.equal(response.status, 401);
});

test('admin cannot create a vehicle with negative stock', async () => {
  const token = await loginAs('seed_admin', process.env.SEED_ADMIN_PASSWORD);

  const response = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${token}`)
    .send({
      name: invalidVehicleName,
      maker: 'Test Motors',
      color: 'Red',
      category: 'sedan',
      price: '35000.00',
      quantityAvailable: -1,
    });

  assert.equal(response.status, 400);
});