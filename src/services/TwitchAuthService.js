const axios = require('axios');
const logger = require('../utils/logger');
const scopes = require('../enum/TwitchScopes');

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const TWITCH_CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;
const TWITCH_REDIRECT_URI = process.env.TWITCH_REDIRECT_URI || "http://localhost:3000/auth/twitch/callback";
const TWITCH_SCOPES = scopes().join(' ');

if (!TWITCH_CLIENT_ID) {
    logger.error('❌ FATAL: TWITCH_CLIENT_ID ist nicht in der .env gesetzt!');
    process.exit(1);
}

if (!TWITCH_CLIENT_SECRET) {
    logger.error('❌ FATAL: TWITCH_CLIENT_SECRET ist nicht in der .env gesetzt!');
    process.exit(1);
}

class TwitchAuthService {
    getAuthURL() {
        const baseURL = 'https://id.twitch.tv/oauth2/authorize';
        const params = new URLSearchParams({
            client_id: TWITCH_CLIENT_ID,
            redirect_uri: TWITCH_REDIRECT_URI,
            response_type: 'code',
            scope: TWITCH_SCOPES,
            force_verify: 'true'
        });

        const finalUrl = `${baseURL}?${params.toString()}`;

        return finalUrl;
    }

    async exchangeCodeForToken(code) {
        const url = 'https://id.twitch.tv/oauth2/token';
        const params = new URLSearchParams({
            client_id: TWITCH_CLIENT_ID,
            client_secret: TWITCH_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: TWITCH_REDIRECT_URI
        });

        try {
            const response = await axios.post(url, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return response.data;

        } catch (error) {
            logger.error('❌ Fehler beim Token-Austausch:', error.response ? error.response.data : error.message);

            if (error.response) {
                logger.error('Status:', error.response.status);
                logger.error('Data:', JSON.stringify(error.response.data, null, 2));
            }

            throw new Error('Token-Austausch fehlgeschlagen.');
        }
    }

    async getUserInfo(accessToken) {
        const url = 'https://api.twitch.tv/helix/users';

        try {
            logger.debug('👤 Rufe Benutzerinfo ab...');

            const response = await axios.get(url, {
                headers: {
                    'Client-ID': TWITCH_CLIENT_ID,
                    'Authorization': `Bearer ${accessToken}`
                }
            });

            const userData = response.data.data[0];

            return {
                id: userData.id,
                login: userData.login,
                display_name: userData.display_name,
                email: userData.email,
                profile_image_url: userData.profile_image_url
            };

        } catch (error) {
            logger.error('❌ Fehler beim Abrufen der Benutzerinfo:', error.response ? error.response.data : error.message);
            throw new Error('Abrufen der Benutzerinformationen fehlgeschlagen.');
        }
    }

    async validateToken(accessToken) {
        const url = 'https://id.twitch.tv/oauth2/validate';

        try {
            const response = await axios.get(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            return response.data;

        } catch (error) {
            logger.warn('⚠️ Token-Validierung fehlgeschlagen');
            throw new Error('Token ist ungültig oder abgelaufen.');
        }
    }

    async refreshAccessToken(refreshToken) {
        const url = 'https://id.twitch.tv/oauth2/token';
        const params = new URLSearchParams({
            client_id: TWITCH_CLIENT_ID,
            client_secret: TWITCH_CLIENT_SECRET,
            grant_type: 'refresh_token',
            refresh_token: refreshToken
        });

        try {
            const response = await axios.post(url, params.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            return response.data;

        } catch (error) {
            logger.error('❌ Fehler beim Token-Refresh:', error.response ? error.response.data : error.message);
            throw new Error('Token-Erneuerung fehlgeschlagen.');
        }
    }
}

const authServiceTTV = new TwitchAuthService();
module.exports = authServiceTTV;