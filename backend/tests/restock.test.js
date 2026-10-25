'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const request = require('supertest');

const app = require('../index');
const { sequelize, Vehicle, Inventory } = require('../models');

let adminToken;
let buyerToken;
const createdIds = [];

async function login(username, password) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ username, password });

  assert.equal(response.status, 200, JSON.stringify(response.body));
  return response.body.token;
}

async function createVehicle(stock) {
  const response = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: `Restock Test ${randomUUID()}`,
      maker: 'Test Motors',
      color: 'White',
      category: 'suv',
      price: '28000.00',
      quantityAvailable: stock,
    });

  assert.equal(response.status, 201, JSON.stringify(response.body));
  createdIds.push(response.body.vehicle.id);
  return response.body.vehicle.id;
}

before(async () => {
  adminToken = await login('seed_admin', process.env.SEED_ADMIN_PASSWORD);
  buyerToken = await login('seed_buyer', process.env.SEED_BUYER_PASSWORD);
});

after(async () => {
  for (const vehicleId of createdIds) {
    await Inventory.destroy({ where: { vehicleId } });
    await Vehicle.destroy({ where: { id: vehicleId } });
  }
  await sequelize.close();
});

test('admin can increase vehicle stock', async () => {
  const id = await createVehicle(1);

  const response = await request(app)
    .post(`/api/vehicles/${id}/restock`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ quantity: 3 });

  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.equal(response.body.quantityAvailable, 4);

  const inventory = await Inventory.findOne({ where: { vehicleId: id } });
  assert.equal(inventory.quantityAvailable, 4);
});

test('buyer cannot restock', async () => {
  const id = await createVehicle(1);

  const response = await request(app)
    .post(`/api/vehicles/${id}/restock`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ quantity: 2 });

  assert.equal(response.status, 403);
});

test('restock requires a token', async () => {
  const id = await createVehicle(1);

  const response = await request(app)
    .post(`/api/vehicles/${id}/restock`)
    .send({ quantity: 2 });

  assert.equal(response.status, 401);
});

test('restock rejects quantity zero', async () => {
  const id = await createVehicle(1);

  const response = await request(app)
    .post(`/api/vehicles/${id}/restock`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ quantity: 0 });

  assert.equal(response.status, 400);
});

test('restocking a missing vehicle returns 404', async () => {
  const response = await request(app)
    .post('/api/vehicles/999999999/restock')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ quantity: 2 });

  assert.equal(response.status, 404);
});

test('simultaneous restocks both increase stock', async () => {
  const id = await createVehicle(0);

  const responses = await Promise.all([
    request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 1 }),
    request(app)
      .post(`/api/vehicles/${id}/restock`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 1 }),
  ]);

  assert.deepEqual(responses.map((response) => response.status), [200, 200]);

  const inventory = await Inventory.findOne({ where: { vehicleId: id } });
  assert.equal(inventory.quantityAvailable, 2);
});