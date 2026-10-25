'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const request = require('supertest');

const app = require('../index');
const { sequelize, Vehicle, Inventory, Purchase } = require('../models');

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
      name: `Purchase Test ${randomUUID()}`,
      maker: 'Test Motors',
      color: 'Blue',
      category: 'sedan',
      price: '25000.00',
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
    await Purchase.destroy({ where: { vehicleId } });
    await Inventory.destroy({ where: { vehicleId } });
    await Vehicle.destroy({ where: { id: vehicleId } });
  }
  await sequelize.close();
});

test('purchase decreases stock and records the price', async () => {
  const id = await createVehicle(2);

  const response = await request(app)
    .post(`/api/vehicles/${id}/purchase`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ quantity: 1 });

  assert.equal(response.status, 201, JSON.stringify(response.body));
  assert.equal(response.body.quantityAvailable, 1);

  const inventory = await Inventory.findOne({ where: { vehicleId: id } });
  assert.equal(inventory.quantityAvailable, 1);

  const purchase = await Purchase.findOne({ where: { vehicleId: id } });
  assert.ok(purchase);
  assert.equal(purchase.quantity, 1);
  assert.equal(Number(purchase.unitPrice), 25000);
});

test('purchase fails when stock is zero', async () => {
  const id = await createVehicle(0);

  const response = await request(app)
    .post(`/api/vehicles/${id}/purchase`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ quantity: 1 });

  assert.equal(response.status, 409);
  assert.equal(await Purchase.count({ where: { vehicleId: id } }), 0);
});

test('purchase cannot request more than the available stock', async () => {
  const id = await createVehicle(1);

  const response = await request(app)
    .post(`/api/vehicles/${id}/purchase`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ quantity: 2 });

  assert.equal(response.status, 409);

  const inventory = await Inventory.findOne({ where: { vehicleId: id } });
  assert.equal(inventory.quantityAvailable, 1);
  assert.equal(await Purchase.count({ where: { vehicleId: id } }), 0);
});

test('purchase rejects quantity zero', async () => {
  const id = await createVehicle(2);

  const response = await request(app)
    .post(`/api/vehicles/${id}/purchase`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ quantity: 0 });

  assert.equal(response.status, 400);
});

test('purchase requires a token', async () => {
  const id = await createVehicle(2);

  const response = await request(app)
    .post(`/api/vehicles/${id}/purchase`)
    .send({ quantity: 1 });

  assert.equal(response.status, 401);
});

test('purchase of a missing vehicle returns 404', async () => {
  const response = await request(app)
    .post('/api/vehicles/999999999/purchase')
    .set('Authorization', `Bearer ${buyerToken}`)
    .send({ quantity: 1 });

  assert.equal(response.status, 404);
});

test('two simultaneous buyers cannot purchase the last vehicle twice', async () => {
  const id = await createVehicle(1);

  const responses = await Promise.all([
    request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ quantity: 1 }),
    request(app)
      .post(`/api/vehicles/${id}/purchase`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ quantity: 1 }),
  ]);

  assert.deepEqual(
    responses.map((response) => response.status).sort(),
    [201, 409],
  );

  const inventory = await Inventory.findOne({ where: { vehicleId: id } });
  assert.equal(inventory.quantityAvailable, 0);
  assert.equal(await Purchase.count({ where: { vehicleId: id } }), 1);
});