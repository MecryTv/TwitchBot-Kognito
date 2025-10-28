const mongoose = require('mongoose');
const logger = require('../../utils/logger');

const UserSchema = new mongoose.Schema({
    twitchId: { type: String, required: true, unique: true },
    username: { type: String, required: true },
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    scope: [String],
    lastLogin: { type: Date, default: Date.now },
}, { timestamps: true });

const UserModel = mongoose.model('User', UserSchema);

/**
 * Verwaltet Datenbankoperationen für Benutzer und deren Tokens.
 */
class UserService {
    static async saveOrUpdateUser(userData) {
        try {
            const { twitchId, username, accessToken, refreshToken, scope } = userData;

            const user = await UserModel.findOneAndUpdate(
                { twitchId },
                {
                    username,
                    accessToken,
                    refreshToken,
                    scope,
                    lastLogin: new Date()
                },
                { upsert: true, new: true, runValidators: true }
            );

            logger.info(`💾 Benutzer ${username} (${twitchId}) gespeichert/aktualisiert.`);
            return user;

        } catch (error) {
            logger.error('❌ Fehler beim Speichern/Aktualisieren des Benutzers:', error.message);
            throw error;
        }
    }

    static async findByTwitchId(twitchId) {
        try {
            return await UserModel.findOne({ twitchId });
        } catch (error) {
            logger.error(`❌ Fehler beim Suchen des Benutzers ${twitchId}:`, error.message);
            throw error;
        }
    }

    static async getAllUsers() {
        try {
            return await UserModel.find({});
        } catch (error) {
            logger.error('❌ Fehler beim Abrufen aller Benutzer:', error.message);
            throw error;
        }
    }

    static async updateUserTokens(twitchId, accessToken, refreshToken) {
        try {
            const user = await UserModel.findOneAndUpdate(
                { twitchId },
                {
                    accessToken,
                    refreshToken,
                    updatedAt: new Date()
                },
                { new: true, runValidators: true }
            );

            if (!user) {
                throw new Error(`Benutzer mit ID ${twitchId} nicht gefunden.`);
            }

            logger.debug(`🔄 Tokens aktualisiert für: ${user.username}`);
            return user;

        } catch (error) {
            logger.error(`❌ Fehler beim Aktualisieren der Tokens für ${twitchId}:`, error.message);
            throw error;
        }
    }

    static async deleteUser(twitchId) {
        try {
            const result = await UserModel.deleteOne({ twitchId });

            if (result.deletedCount > 0) {
                logger.info(`🗑️ Benutzer ${twitchId} gelöscht.`);
                return true;
            }

            return false;
        } catch (error) {
            logger.error(`❌ Fehler beim Löschen des Benutzers ${twitchId}:`, error.message);
            throw error;
        }
    }

    /**
     * Zählt die Anzahl der Benutzer in der Datenbank.
     * @returns {Promise<number>} Anzahl der Benutzer
     */
    static async countUsers() {
        try {
            return await UserModel.countDocuments();
        } catch (error) {
            logger.error('❌ Fehler beim Zählen der Benutzer:', error.message);
            throw error;
        }
    }
}

module.exports = UserService;