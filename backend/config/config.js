require('dotenv').config();

const databaseConfig = (environmentVariable) => ({
  use_env_variable: environmentVariable,
  dialect: 'mysql',
  logging: false,
});

module.exports = {
  development: databaseConfig('DATABASE_URL'),
  test: databaseConfig('DATABASE_TEST_URL'),
  production: databaseConfig('DATABASE_URL'),
};
