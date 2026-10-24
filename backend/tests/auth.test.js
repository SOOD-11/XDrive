const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../index');
const { sequelize } = require('../models');

after(async () => {
  await sequelize.close();
});

test('seeded buyer can log in', async () => {
  assert.ok(123445, 'Set SEED_BUYER_PASSWORD');

  const response = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'seed_buyer',
      password: '123445',
    });

  assert.equal(response.status, 200);
  assert.equal(typeof response.body.token, 'string');
  assert.equal(response.body.user.role, 'buyer');
});