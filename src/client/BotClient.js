const { ChatClient } = require("@twurple/chat")
const { StaticAuthProvider } = require("@twurple/auth")

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
            console.log(`BotClient: Erfolgreich mit dem Chat verbunden!`);
            console.log(`BotClient: Verfolgt Kanal: ${config.channel}`);
        });

        this.client.onDisconnect((wasClean) => {
            console.log(`BotClient: Verbindung getrennt (Sauber: ${wasClean})`);
        });
    }

    onConnect() {
        return this.client.connect();
    }

    onMessage(channel, user, message, msg) {
        // Ignoriere Nachrichten vom Bot selbst (Twurple prüft dies auch über msg.isSelf, aber der Username-Vergleich ist sicher)
        if (user.toLowerCase() === this.config.botName.toLowerCase()) return;

        // Alternativ und Twurple-spezifisch:
        // if (msg.isSelf) return;

        const displayName = msg.userInfo.displayName; // Der angezeigte Name
        const username = user; // Der Login-Name (immer kleingeschrieben)

        // 1. Nachrichten hören: Einfache Konsolenausgabe
        console.log(`[${channel}] <${displayName} (${username})>: ${message}`);

        // 2. Nachrichten lesen/reagieren: Beispiel !ping
        if (message.toLowerCase() === '!ping') {
            // client.say() funktioniert genau gleich
            this.client.say(channel, `@${displayName}, Pong!`);
        }

        // 3. Nachrichten lesen/reagieren: Beispiel einfacher Custom Command
        if (message.toLowerCase().includes('bot ist doof')) {
            this.client.say(channel, `@${displayName}, Das ist nicht nett 😔!`);
        }
    }
}

module.exports = BotClient;