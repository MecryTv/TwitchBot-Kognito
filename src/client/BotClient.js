// src/BotClient.js

const tmi = require('tmi.js');

class BotClient {
    constructor(config) {
        this.config = config;

        // TMI.js Client initialisieren
        this.client = new tmi.Client({
            options: { debug: false },
            connection: { reconnect: true },
            identity: {
                username: config.botName,
                password: config.oauthToken // Der Token für den Chat-Login
            },
            channels: [config.channel]
        });

        // Events abonnieren:
        this.client.on('message', this.onMessage.bind(this)); // Hören von Nachrichten
        this.client.on('connected', (address, port) => {
            console.log(`BotClient: Erfolgreich mit dem Chat (${address}:${port}) verbunden!`);
        });
    }

    connect() {
        this.client.connect();
    }

    // Methode, die bei JEDER empfangenen Nachricht ausgeführt wird
    onMessage(channel, tags, message, self) {
        // Ignoriere Nachrichten vom Bot selbst
        if (self) return;

        const username = tags.username;

        // 1. Nachrichten hören: Einfache Konsolenausgabe
        console.log(`[${channel}] <${username}>: ${message}`);

        // 2. Nachrichten lesen/reagieren: Beispiel !ping
        if (message.toLowerCase() === '!ping') {
            this.client.say(channel, `@${username}, Pong!`);
        }

        // 3. Nachrichten lesen/reagieren: Beispiel einfacher Custom Command
        if (message.toLowerCase().includes('bot ist doof')) {
            this.client.say(channel, `@${username}, Das ist nicht nett 😔!`);
        }
    }
}

module.exports = BotClient;