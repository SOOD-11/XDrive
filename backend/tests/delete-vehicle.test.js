'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const request = require('supertest');

const app = require('../index');
const { sequelize, User, Vehicle, Inventory, Purchase } = require('../models');

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

async function createVehicle() {
  const response = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: `Delete Test ${randomUUID()}`,
      maker: 'Test Motors',
      color: 'Black',
      category: 'suv',
      price: '30000.00',
      quantityAvailable: 2,
    });

  assert.equal(response.status, 201, JSON.stringify(response.body));
  const id = response.body.vehicle.id;
  createdIds.push(id);
  return id;
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

test('admin can delete a vehicle and its stock record', async () => {
  const id = await createVehicle();

  const response = await request(app)
    .delete(`/api/vehicles/${id}`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(response.status, 204);
  assert.equal(await Vehicle.findByPk(id), null);
  assert.equal(await Inventory.findOne({ where: { vehicleId: id } }), null);
});

test('buyer cannot delete a vehicle', async () => {
  const id = await createVehicle();

  const response = await request(app)
    .delete(`/api/vehicles/${id}`)
    .set('Authorization', `Bearer ${buyerToken}`);

  assert.equal(response.status, 403);
  assert.ok(await Vehicle.findByPk(id));
});

test('deleting a vehicle requires a token', async () => {
  const id = await createVehicle();

  const response = await request(app).delete(`/api/vehicles/${id}`);

  assert.equal(response.status, 401);
});

test('deleting a missing vehicle returns 404', async () => {
  const response = await request(app)
    .delete('/api/vehicles/999999999')
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(response.status, 404);
});

test('vehicle with purchase history cannot be deleted', async () => {
  const id = await createVehicle();
  const buyer = await User.findOne({ where: { username: 'seed_buyer' } });
  assert.ok(buyer);

  const purchase = await Purchase.create({
    userId: buyer.id,
    vehicleId: id,
    quantity: 1,
    unitPrice: '30000.00',
    purchasedAt: new Date(),
  });

  const response = await request(app)
    .delete(`/api/vehicles/${id}`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(response.status, 409);
  assert.ok(await Vehicle.findByPk(id));
assert.ok(await Purchase.findOne({
  where: { userId: buyer.id, vehicleId: id },
}));
});