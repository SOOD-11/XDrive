const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');

const app = require('../index');
const { randomUUID } = require('node:crypto');

const { User,sequelize } = require('../models');

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



test('register creates a buyer with a hashed password', async () => {
  const username = `buyer_${randomUUID().slice(0, 8)}`;
  const password = 'StrongPass123!';

  try {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ username, password });

    assert.equal(response.status, 201);
    assert.equal(response.body.user.username, username);
    assert.equal(response.body.user.role, 'buyer');
    assert.equal(response.body.user.passwordHash, undefined);

    const savedUser = await User.findOne({ where: { username } });
    assert.ok(savedUser);
    assert.equal(savedUser.role, 'buyer');
    assert.notEqual(savedUser.passwordHash, password);
  } finally {
    await User.destroy({ where: { username } });
  }
});