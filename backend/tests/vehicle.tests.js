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
async function searchVehicles(filters) {
  const login = await request(app)
    .post('/api/auth/login')
    .send({
      username: 'seed_buyer',
      password: process.env.SEED_BUYER_PASSWORD,
    });

  assert.equal(login.status, 200);

  const query = new URLSearchParams(filters).toString();

  return request(app)
    .get(`/api/vehicles/search?${query}`)
    .set('Authorization', `Bearer ${login.body.token}`);
}

test('searches vehicles by maker', async () => {
  const response = await searchVehicles({ maker: 'Xtreme' });

  assert.equal(response.status, 200);
  assert.ok(response.body.vehicles.some(
    (vehicle) => vehicle.name === 'Sample Family Sedan',
  ));
  assert.ok(response.body.vehicles.every(
    (vehicle) => vehicle.maker.includes('Xtreme'),
  ));
});

test('searches vehicles by name', async () => {
  const response = await searchVehicles({ name: 'City' });

  assert.equal(response.status, 200);
  assert.ok(response.body.vehicles.some(
    (vehicle) => vehicle.name === 'Sample City SUV',
  ));
  assert.ok(response.body.vehicles.every(
    (vehicle) => vehicle.name.includes('City'),
  ));
});

test('searches vehicles by category', async () => {
  const response = await searchVehicles({ category: 'muv' });

  assert.equal(response.status, 200);
  assert.ok(response.body.vehicles.some(
    (vehicle) => vehicle.name === 'Sample Utility MUV',
  ));
  assert.ok(response.body.vehicles.every(
    (vehicle) => vehicle.category === 'muv',
  ));
});

test('searches vehicles within an inclusive price range', async () => {
  const response = await searchVehicles({
    minPrice: '24500',
    maxPrice: '28750',
  });

  assert.equal(response.status, 200);

  const vehicles = response.body.vehicles;
  assert.ok(vehicles.some((vehicle) => vehicle.name === 'Sample Family Sedan'));
  assert.ok(vehicles.some((vehicle) => vehicle.name === 'Sample Utility MUV'));
  assert.ok(vehicles.every(
    (vehicle) => Number(vehicle.price) >= 24500 &&
      Number(vehicle.price) <= 28750,
  ));
});

test('search requires a token', async () => {
  const response = await request(app).get('/api/vehicles/search?category=suv');

  assert.equal(response.status, 401);
});