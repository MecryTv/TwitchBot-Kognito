const express = require('express');
const router = express.Router();
const UserService = require('../../database/service/UserService');
const authServiceTTV = require('../../services/TwitchAuthService');
const logger = require('../../utils/logger');

router.get('/login', (req, res) => {
    const authURL = authServiceTTV.getAuthURL();
    res.redirect(authURL);
});

router.get('/twitch/callback', async (req, res) => {
    const { code, scope } = req.query;

    if (!code) {
        logger.warn('❌ Twitch-Callback ohne Code erhalten');
        return res.status(400).send('Autorisierung fehlgeschlagen. Kein Code erhalten.');
    }

    try {
        logger.info('🔄 Tausche Authorization Code gegen Access Token...');
        const tokenData = await authServiceTTV.exchangeCodeForToken(code);
        const { access_token, refresh_token, scope: tokenScope } = tokenData;

        const scopesToStore = (Array.isArray(tokenScope) ? tokenScope : scope.split(' ')).filter(s => s);

        logger.info('👤 Rufe Benutzerinformationen von Twitch ab...');
        const userInfo = await authServiceTTV.getUserInfo(access_token);

        const userData = {
            twitchId: userInfo.id,
            username: userInfo.login,
            displayName: userInfo.display_name,
            accessToken: access_token,
            refreshToken: refresh_token,
            scope: scopesToStore,
        };

        logger.info(`💾 Speichere Benutzer: ${userData.username} (${userData.twitchId})`);
        const storedUser = await UserService.saveOrUpdateUser(userData);

        // WICHTIG: Alle benötigten Daten in Session speichern
        req.session.userId = storedUser.twitchId;
        req.session.username = storedUser.username;
        req.session.displayName = storedUser.displayName; // ✅ Hinzugefügt
        req.session.accessToken = access_token; // ✅ Hinzugefügt
        req.session.refreshToken = refresh_token; // ✅ Optional, aber nützlich

        logger.info(`✅ Login erfolgreich für: ${storedUser.username}`);
        logger.info(`🔄 Weiterleitung zu /dashboard`);

        req.session.save((err) => {
            if (err) {
                logger.error('❌ Fehler beim Speichern der Session:', err);
                return res.status(500).send('Session-Fehler');
            }
            res.redirect('/dashboard');
        });

    } catch (error) {
        logger.error('❌ Fehler im OAuth-Callback:', error.message);
        res.status(500).send(`
            <h1>Authentifizierung fehlgeschlagen</h1>
            <p>${error.message}</p>
            <a href="/">Zurück zur Startseite</a>
        `);
    }
});

router.get('/logout', (req, res) => {
    const username = req.session?.username || 'Unbekannt';

    req.session.destroy(err => {
        if (err) {
            logger.error('❌ Fehler beim Logout:', err);
            return res.status(500).send('Fehler beim Logout.');
        }
        logger.info(`👋 Benutzer ${username} hat sich ausgeloggt`);
        res.redirect('/');
    });
});

module.exports = router;