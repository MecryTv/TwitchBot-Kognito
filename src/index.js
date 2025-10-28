require('dotenv').config();
const BotClient = require('./client/BotClient');
const WebServer = require('./server');

const config = {
    botName: process.env.BOT_NAME,
    oauthToken: `oauth:${process.env.BOT_ACCESS_TOKEN}`,
    clientId: process.env.BOT_CLIENT_ID,
    channel: "MecryTv",
    port: 3000,
};

const botClient = new BotClient(config);
botClient.onConnect();

console.log('Bot-System initialisiert und wartet auf Chat-Nachrichten...');