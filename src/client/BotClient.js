const { ChatClient } = require("@twurple/chat")
const { StaticAuthProvider } = require("@twurple/auth")
const logger = require("../utils/logger");

class BotClient {
    constructor(config) {
        this.config = config;

        const accessToken = config.oauthToken.startsWith('oauth:')
            ? config.oauthToken.substring(6)
            : config.oauthToken;

        const authProvider = new StaticAuthProvider(config.clientId, accessToken);

        this.client = new ChatClient({
            authProvider: authProvider,
            channels: [config.channel]
        });

        this.client.onMessage(this.onMessage.bind(this));

        this.client.onConnect(() => {
            logger.twitch("BotClient: Verbunden mit Twitch Chat");
        });

        this.client.onDisconnect((wasClean) => {
            logger.twitch(`BotClient: Verbindung getrennt (clean: ${wasClean})`);
        });
    }

    onConnect() {
        return this.client.connect();
    }

    onMessage(channel, user, message, msg) {
        if (user.toLowerCase() === this.config.botName.toLowerCase()) return;

        const displayName = msg.userInfo.displayName;
        const username = user;

        console.log(`[${channel}] <${displayName} (${username})>: ${message}`);

        if (message.toLowerCase() === '!ping') {
            this.client.say(channel, `@${displayName}, Pong!`);
        }

        if (message.toLowerCase().includes('bot ist doof')) {
            this.client.say(channel, `@${displayName}, Das ist nicht nett 😔!`);
        }
    }
}

module.exports = BotClient;