require('dotenv').config();
const BotClient = require('./client/BotClient');
const WebServer = require('./server');

const config = {
    botName: process.env.BOT_NAME,
    oauthToken: `oauth:${process.env.BOT_ACCESS_TOKEN}`,
    channel: "MecryTv",
    port: 3000,
};

const botClient = new BotClient(config);
botClient.connect();

console.log('Bot-System initialisiert und wartet auf Chat-Nachrichten...');