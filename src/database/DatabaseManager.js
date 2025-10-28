const mongoose = require('mongoose');
const logger = require('../utils/logger');

class DatabaseManager {
    constructor() {
        this.isConnected = false;
    }
    async connect() {
        if (this.isConnected) {
            logger.info('Datenbank ist bereits verbunden.');
            return;
        }

        const mongoUri = process.env.MONGODB_URI;

        if (!mongoUri) {
            logger.error('FATAL: MONGODB_URI ist in den Umgebungsvariablen nicht gesetzt.');
            process.exit(1);
        }

        try {
            await mongoose.connect(mongoUri);
            this.isConnected = true;
            logger.info('✅  Mongoose: Erfolgreich mit MongoDB verbunden.');
        } catch (error) {
            logger.error('❌ Mongoose: Fehler beim Verbinden mit MongoDB:', error.message);
            process.exit(1);
        }
    }

    /**
     * Gibt das Mongoose-Verbindungsobjekt zurück (oder null, falls nicht verbunden).
     * @returns {Object|null} Das Mongoose-Verbindungsobjekt.
     */
    getClient() {
        if (!this.isConnected) {
            logger.warn('Mongoose-Client angefordert, aber Verbindung nicht hergestellt.');
            return null;
        }
        return mongoose.connection;
    }
}

module.exports = DatabaseManager;