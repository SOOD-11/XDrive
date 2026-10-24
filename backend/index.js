require('dotenv').config();

const express = require('express');
const { sequelize } = require('./models');
const authRouter=require('./routes/auth.routes');
const app = express();
const port = Number(process.env.PORT) || 3000;

app.use(express.json());

app.get('/health', async (_req, res) => {
  try {
    await sequelize.authenticate();
    res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('Database health check failed:', error);
    res.status(503).json({ status: 'error', database: 'disconnected' });
  }
});



app.use('/api/auth',authRouter);


async function start() {
  await sequelize.authenticate();

  app.listen(port, () => {
    console.log(`Backend listening on port ${port}`);
  });
}

if (require.main === module) {
  start().catch((error) => {
    console.error('Failed to start backend:', error);
    process.exitCode = 1;
  });
}

module.exports = app;