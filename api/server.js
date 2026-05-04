const { initDatabase } = require('../lib/database');
const { createApp } = require('./app');

const PORT = Number(process.env.PORT) || 3000;

async function startServer() {
  await initDatabase();

  const app = createApp();
  app.listen(PORT, () => {
    console.log(`Task API listening on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start API server:', err.message);
  process.exit(1);
});
