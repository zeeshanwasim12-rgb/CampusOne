/**
 * Server entrypoint: connect to MongoDB, create the HTTP server, attach
 * Socket.IO, and start listening. Handles graceful shutdown so nodemon
 * restarts and container stops don't leak connections.
 */
import http from 'node:http';
import { Server as SocketServer } from 'socket.io';

import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/db.js';
import { initSockets } from './sockets/chatSocket.js';
import { logger } from './utils/logger.js';

async function start() {
  await connectDB();

  const server = http.createServer(app);

  const io = new SocketServer(server, {
    cors: { origin: config.clientUrls, credentials: true },
  });
  initSockets(io);

  // Optional: seed the database on boot (handy for fresh cloud deploys).
  if (config.seedOnStart) {
    const { runSeed } = await import('./seed/seed.js');
    await runSeed({ keepConnection: true }).catch((e) => logger.error(`Seed failed: ${e.message}`));
  }

  server.listen(config.port, () => {
    logger.info(`CampusOne API running on http://localhost:${config.port} [${config.env}]`);
    logger.info(`Health: http://localhost:${config.port}/api/health`);
  });

  const shutdown = async (signal) => {
    logger.info(`${signal} received, shutting down...`);
    io.close();
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    // Force-exit if it hangs.
    setTimeout(() => process.exit(1), 10000).unref();
  };
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  logger.error(`Failed to start server: ${err.message}`);
  process.exit(1);
});
