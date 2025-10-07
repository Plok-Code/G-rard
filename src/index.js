const process = require('process');
const { startDiscord } = require('./discord/client');
const { startHttpServer } = require('./server');
const { startDriveMonitor } = require('./drive/monitor');

async function bootstrap() {
  try {
    await startDiscord();
    startHttpServer();
    startDriveMonitor();
  } catch (error) {
    console.error('[Bootstrap] Echec du demarrage', error);
    process.exit(1);
  }
}

process.on('unhandledRejection', (reason) => {
  console.error('[Process] Promesse rejetee sans gestionnaire', reason);
});

process.on('uncaughtException', (error) => {
  console.error('[Process] Exception non interceptee', error);
});

bootstrap();
