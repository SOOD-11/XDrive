'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const request = require('supertest');

const app = require('../index');
const { sequelize, Vehicle, Inventory } = require('../models');

let adminToken;
let buyerToken;
let vehicleId;

async function login(username, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body.token;
}

before(async () => {
  adminToken = await login('seed_admin', process.env.SEED_ADMIN_PASSWORD);
  buyerToken = await login('seed_buyer', process.env.SEED_BUYER_PASSWORD);

  const response = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: `Update Test ${randomUUID()}`,
      maker: 'Original Motors',
      color: 'Blue',
      category: 'sedan',
      price: '30000.00',
      quantityAvailable: 2,
    });

  assert.equal(response.status, 201, JSON.stringify(response.body));
  vehicleId = response.body.vehicle.id;
});

after(async () => {
  if (vehicleId) {
    await Inventory.destroy({ where: { vehicleId } });
    await Vehicle.destroy({ where: { id: vehicleId } });
  }
  await sequelize.close();
});

test('admin can update vehicle details without changing stock', async () => {
  const response = await request(app)
    .put(`/api/vehicles/${vehicleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ maker: 'Updated Motors', price: '42000.00' });

  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.vehicle.maker, 'Updated Motors');
  assert.equal(Number(response.body.vehicle.price), 42000);
  assert.equal(response.body.vehicle.quantityAvailable, 2);

  const savedVehicle = await Vehicle.findByPk(vehicleId);
  assert.equal(savedVehicle.maker, 'Updated Motors');
});

test('buyer cannot update a vehicle', async () => {
  const response = await request(app)
    .put(`/api/vehicles/${vehicleId}`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ maker: 'Buyer Motors' });

  assert.equal(response.status, 403);
});

test('updating a vehicle requires a token', async () => {
  const response = await request(app)
    .put(`/api/vehicles/${vehicleId}`)
    .send({ maker: 'Someone Motors' });

  assert.equal(response.status, 401);
});

test('updating a missing vehicle returns 404', async () => {
  const response = await request(app)
    .put('/api/vehicles/999999999')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ maker: 'Updated Motors' });

  assert.equal(response.status, 404);
});

test('vehicle update rejects a negative price', async () => {
  const response = await request(app)
    .put(`/api/vehicles/${vehicleId}`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ price: -10 });

  assert.equal(response.status, 400);
});