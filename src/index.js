require('dotenv').config();
const BotClient = require('./client/BotClient');
const WebServer = require('./dashboard/WebServer');
const logger = require('./utils/logger');
const DatabaseManager = require('./database/DatabaseManager');
const tokenRefreshService = require('./services/TokenRefreshService');

const config = {
    botName: process.env.BOT_NAME,
    oauthToken: `oauth:${process.env.BOT_ACCESS_TOKEN}`,
    clientId: process.env.BOT_CLIENT_ID,
    channel: "MecryTv"
};

async function startApplication() {
    try {
        logger.mtvBanner();

        const dbManager = new DatabaseManager();
        await dbManager.connect();

        const botClient = new BotClient(config);
        botClient.onConnect();

        const webServer = new WebServer(3000);
        webServer.start();

        tokenRefreshService.start(30);

        logger.info(`✅ Logged in as: ${config.botName}`);
        logger.info(`🔄 Token-Refresh-Service aktiv`);
        const gracefulShutdown = (signal) => {
            logger.info(`\n⚠️ ${signal} empfangen, fahre Anwendung herunter...`);

            tokenRefreshService.stop();

            logger.info('👋 Anwendung beendet.');
            process.exit(0);
        };

        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    } catch (error) {
        logger.error('🚫 Kritischer Fehler beim Starten der Anwendung:', error.message);
        process.exit(1);
    }
}

startApplication();