'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const request = require('supertest');

const app = require('../index');
const imageService = require('../services/image.service');
const { sequelize, Vehicle, Inventory } = require('../models');

const imageUrl = 'https://res.cloudinary.com/test/image/upload/car.png';
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
      name: `Image Test ${randomUUID()}`,
      maker: 'Test Motors',
      color: 'Silver',
      category: 'sedan',
      price: '25000.00',
      quantityAvailable: 1,
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

test('admin uploads an image and its URL is saved', async () => {
  const originalUpload = imageService.uploadVehicleImage;

  imageService.uploadVehicleImage = async (buffer) => {
    assert.ok(Buffer.isBuffer(buffer));
    return imageUrl;
  };

  try {
    const response = await request(app)
      .post(`/api/vehicles/${vehicleId}/image`)
      .set('Authorization', `Bearer ${adminToken}`)
      .attach('image', Buffer.from('test image'), {
        filename: 'car.png',
        contentType: 'image/png',
      });

    assert.equal(response.status, 200, JSON.stringify(response.body));
    assert.equal(response.body.vehicle.vehicleUrl, imageUrl);

    const vehicle = await Vehicle.findByPk(vehicleId);
    assert.equal(vehicle.vehicleUrl, imageUrl);
  } finally {
    imageService.uploadVehicleImage = originalUpload;
  }
});

test('buyer cannot upload a vehicle image', async () => {
  const response = await request(app)
    .post(`/api/vehicles/${vehicleId}/image`)
    .set('Authorization', `Bearer ${buyerToken}`)
    .attach('image', Buffer.from('test image'), {
      filename: 'car.png',
      contentType: 'image/png',
    });

  assert.equal(response.status, 403);
});

test('image upload requires a token', async () => {
  const response = await request(app)
    .post(`/api/vehicles/${vehicleId}/image`)
    .attach('image', Buffer.from('test image'), {
      filename: 'car.png',
      contentType: 'image/png',
    });

  assert.equal(response.status, 401);
});

test('image upload requires a file', async () => {
  const response = await request(app)
    .post(`/api/vehicles/${vehicleId}/image`)
    .set('Authorization', `Bearer ${adminToken}`);

  assert.equal(response.status, 400);
});

test('image upload rejects a non-image file', async () => {
  const response = await request(app)
    .post(`/api/vehicles/${vehicleId}/image`)
    .set('Authorization', `Bearer ${adminToken}`)
    .attach('image', Buffer.from('some text'), {
      filename: 'notes.txt',
      contentType: 'text/plain',
    });

  assert.equal(response.status, 400);
});

test('image upload for a missing vehicle returns 404', async () => {
  const response = await request(app)
    .post('/api/vehicles/999999999/image')
    .set('Authorization', `Bearer ${adminToken}`)
    .attach('image', Buffer.from('test image'), {
      filename: 'car.png',
      contentType: 'image/png',
    });

  assert.equal(response.status, 404);
});