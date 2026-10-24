const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../index');
const { sequelize } = require('../models');

after(async () => {
  await sequelize.close();
});

test('buyer can see vehicles with their stock', async () => {
  const login = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'seed_buyer',
      password: process.env.SEED_BUYER_PASSWORD,
    });

  assert.equal(login.status, 200);

  const response = await request(app)
    .get('/api/vehicles')
    .set('Authorization', `Bearer ${login.body.token}`);

  assert.equal(response.status, 200);
  assert.ok(Array.isArray(response.body.vehicles));

  const sedan = response.body.vehicles.find(
    (vehicle) => vehicle.name === 'Sample Family Sedan',
  );

  assert.ok(sedan);
  assert.equal(sedan.maker, 'Xtreme Motors');
  assert.equal(typeof sedan.quantityAvailable, 'number');
});

test('vehicles cannot be listed without a token', async () => {
  const response = await request(app).get('/api/vehicles');

  assert.equal(response.status, 401);
});
