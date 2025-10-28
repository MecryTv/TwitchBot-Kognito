const authServiceTTV = require('./TwitchAuthService');
const UserService = require('../database/service/UserService');
const logger = require('../utils/logger');

class TokenRefreshService {
    constructor() {
        this.isRunning = false;
        this.intervalId = null;
        this.checkInterval = 30 * 60 * 1000;
    }

    start(intervalMinutes = 30) {
        if (this.isRunning) {
            logger.warn('⚠️ TokenRefreshService läuft bereits.');
            return;
        }

        this.checkInterval = intervalMinutes * 60 * 1000;
        this.isRunning = true;

        logger.info(`🔄 TokenRefreshService gestartet (Intervall: ${intervalMinutes} Minuten)`);

        this.checkAllTokens();

        this.intervalId = setInterval(() => {
            this.checkAllTokens();
        }, this.checkInterval);
    }

    stop() {
        if (!this.isRunning) {
            logger.warn('⚠️ TokenRefreshService läuft nicht.');
            return;
        }

        clearInterval(this.intervalId);
        this.isRunning = false;
        logger.info('🛑 TokenRefreshService gestoppt.');
    }

    /**
     * Prüft alle Benutzer-Tokens in der Datenbank
     */
    async checkAllTokens() {
        try {
            logger.info('🔍 Starte Token-Überprüfung für alle Benutzer...');

            const users = await UserService.getAllUsers();

            if (!users || users.length === 0) {
                logger.info('ℹ️ Keine Benutzer in der Datenbank gefunden.');
                return;
            }

            logger.info(`📊 Überprüfe Tokens von ${users.length} Benutzer(n)...`);

            let refreshedCount = 0;
            let validCount = 0;
            let errorCount = 0;

            for (const user of users) {
                try {
                    const result = await this.checkAndRefreshToken(user);

                    if (result.refreshed) {
                        refreshedCount++;
                    } else if (result.valid) {
                        validCount++;
                    }
                } catch (error) {
                    errorCount++;
                    logger.error(`❌ Fehler bei Benutzer ${user.username}:`, error.message);
                }
            }

            logger.info(`✅  Token-Überprüfung abgeschlossen:`);
            logger.info(`    ✓ Gültig: ${validCount}`);
            logger.info(`    🔄 Erneuert: ${refreshedCount}`);
            logger.info(`    ❌ Fehler: ${errorCount}`);

        } catch (error) {
            logger.error('❌ Fehler bei der Token-Überprüfung:', error.message);
        }
    }

    async checkAndRefreshToken(user) {
        try {
            const validation = await authServiceTTV.validateToken(user.accessToken);

            const expiresIn = validation.expires_in;
            const hoursLeft = (expiresIn / 3600).toFixed(2);

            if (expiresIn < this.refreshThreshold) {
                logger.info(`⏰ Token für ${user.username} läuft bald ab (${hoursLeft}h), erneuere...`);

                await this.refreshUserToken(user);

                return { valid: false, refreshed: true };
            }

            return { valid: true, refreshed: false };

        } catch (error) {
            if (error.message.includes('ungültig') || error.message.includes('abgelaufen')) {
                logger.warn(`⚠️ Token für ${user.username} ist ungültig, versuche Refresh...`);

                try {
                    await this.refreshUserToken(user);
                    return { valid: false, refreshed: true };
                } catch (refreshError) {
                    logger.error(`❌ Token-Refresh fehlgeschlagen für ${user.username}:`, refreshError.message);
                    throw refreshError;
                }
            }

            throw error;
        }
    }

    async refreshUserToken(user) {
        try {
            logger.info(`🔄 Erneuere Token für Benutzer: ${user.username}`);

            const newTokenData = await authServiceTTV.refreshAccessToken(user.refreshToken);

            const updatedUser = await UserService.updateUserTokens(
                user.twitchId,
                newTokenData.access_token,
                newTokenData.refresh_token || user.refreshToken // Falls kein neuer Refresh Token zurückkommt
            );

            logger.info(`✅ Token erfolgreich erneuert für: ${user.username}`);

            return updatedUser;

        } catch (error) {
            logger.error(`❌ Fehler beim Erneuern des Tokens für ${user.username}:`, error.message);
            throw error;
        }
    }

    async refreshTokenForUser(twitchId) {
        try {
            const user = await UserService.findByTwitchId(twitchId);

            if (!user) {
                throw new Error(`Benutzer mit ID ${twitchId} nicht gefunden.`);
            }

            return await this.checkAndRefreshToken(user);

        } catch (error) {
            logger.error(`❌ Fehler beim Token-Refresh für Benutzer ${twitchId}:`, error.message);
            throw error;
        }
    }

    getStatus() {
        return {
            isRunning: this.isRunning,
            checkIntervalMinutes: this.checkInterval / (60 * 1000),
            refreshThresholdHours: this.refreshThreshold / 3600
        };
    }
}

const tokenRefreshService = new TokenRefreshService();
module.exports = tokenRefreshService;