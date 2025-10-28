const express = require('express');
const router = express.Router();
const tokenRefreshService = require('../../services/TokenRefreshService');
const UserService = require('../../database/service/UserService');
const logger = require('../../utils/logger');

function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect('/');
    }
    next();
}

router.get('/', requireAuth, async (req, res) => {
    try {
        const serviceStatus = tokenRefreshService.getStatus();

        const userCount = await UserService.countUsers();

        res.send(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Token Management</title>
                <script src="https://cdn.tailwindcss.com"></script>
            </head>
            <body class="bg-gray-900 text-white min-h-screen">
                <div class="container mx-auto p-8">
                    <div class="mb-6">
                        <a href="/dashboard" class="text-purple-400 hover:text-purple-300">← Zurück zum Dashboard</a>
                    </div>

                    <h1 class="text-4xl font-bold mb-8 text-purple-400">🔑 Token Management</h1>

                    <div class="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
                        <h2 class="text-2xl font-bold mb-4">Service Status</h2>
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div class="bg-gray-700 p-4 rounded">
                                <p class="text-gray-400 mb-1">Status</p>
                                <p class="text-2xl font-bold ${serviceStatus.isRunning ? 'text-green-400' : 'text-red-400'}">
                                    ${serviceStatus.isRunning ? '✅ Aktiv' : '❌ Inaktiv'}
                                </p>
                            </div>
                            <div class="bg-gray-700 p-4 rounded">
                                <p class="text-gray-400 mb-1">Prüfintervall</p>
                                <p class="text-2xl font-bold">${serviceStatus.checkIntervalMinutes} Min</p>
                            </div>
                            <div class="bg-gray-700 p-4 rounded">
                                <p class="text-gray-400 mb-1">Refresh-Schwelle</p>
                                <p class="text-2xl font-bold">${serviceStatus.refreshThresholdHours}h</p>
                            </div>
                        </div>
                    </div>

                    <div class="bg-gray-800 rounded-lg shadow-xl p-6 mb-6">
                        <h2 class="text-2xl font-bold mb-4">Benutzer-Übersicht</h2>
                        <div class="bg-gray-700 p-4 rounded">
                            <p class="text-gray-400 mb-1">Gesamt</p>
                            <p class="text-2xl font-bold">${userCount} Benutzer</p>
                        </div>
                    </div>

                    <div class="bg-gray-800 rounded-lg shadow-xl p-6">
                        <h2 class="text-2xl font-bold mb-4">Aktionen</h2>
                        <div class="space-y-3">
                            <form method="POST" action="/tokens/check-all">
                                <button type="submit" class="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-6 rounded">
                                    🔄 Alle Tokens jetzt prüfen
                                </button>
                            </form>
                            
                            <form method="POST" action="/tokens/refresh-mine">
                                <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded">
                                    🔑 Meinen Token jetzt aktualisieren
                                </button>
                            </form>

                            ${serviceStatus.isRunning
            ? '<form method="POST" action="/tokens/stop"><button type="submit" class="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded">⏸️ Service stoppen</button></form>'
            : '<form method="POST" action="/tokens/start"><button type="submit" class="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded">▶️ Service starten</button></form>'
        }
                        </div>
                    </div>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        logger.error('Fehler beim Laden der Token-Management-Seite:', error);
        res.status(500).send('Fehler beim Laden der Seite.');
    }
});

router.post('/check-all', requireAuth, async (req, res) => {
    try {
        logger.info(`🔄 Manuelle Token-Prüfung gestartet von: ${req.session.username}`);

        tokenRefreshService.checkAllTokens().catch(err => {
            logger.error('Fehler bei manueller Token-Prüfung:', err);
        });

        res.send(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Token-Prüfung gestartet</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <meta http-equiv="refresh" content="3;url=/tokens">
            </head>
            <body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <div class="text-6xl mb-4">🔄</div>
                    <h1 class="text-3xl font-bold mb-4">Token-Prüfung gestartet</h1>
                    <p class="text-gray-400 mb-4">Die Überprüfung läuft im Hintergrund...</p>
                    <p class="text-sm text-gray-500">Weiterleitung in 3 Sekunden...</p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        logger.error('Fehler beim Starten der Token-Prüfung:', error);
        res.status(500).send('Fehler beim Starten der Prüfung.');
    }
});

router.post('/refresh-mine', requireAuth, async (req, res) => {
    try {
        logger.info(`🔑 Token-Refresh angefordert von: ${req.session.username}`);

        await tokenRefreshService.refreshTokenForUser(req.session.userId);

        res.send(`
            <!DOCTYPE html>
            <html lang="de">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Token aktualisiert</title>
                <script src="https://cdn.tailwindcss.com"></script>
                <meta http-equiv="refresh" content="3;url=/tokens">
            </head>
            <body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                <div class="text-center">
                    <div class="text-6xl mb-4">✅</div>
                    <h1 class="text-3xl font-bold mb-4">Token erfolgreich aktualisiert</h1>
                    <p class="text-gray-400 mb-4">Ihr Access Token wurde erneuert.</p>
                    <p class="text-sm text-gray-500">Weiterleitung in 3 Sekunden...</p>
                </div>
            </body>
            </html>
        `);
    } catch (error) {
        logger.error('Fehler beim Token-Refresh:', error);
        res.status(500).send(`Fehler beim Aktualisieren des Tokens: ${error.message}`);
    }
});


router.post('/start', requireAuth, (req, res) => {
    try {
        tokenRefreshService.start(30);
        logger.info(`▶️ Token-Refresh-Service gestartet von: ${req.session.username}`);
        res.redirect('/tokens');
    } catch (error) {
        logger.error('Fehler beim Starten des Services:', error);
        res.status(500).send('Fehler beim Starten des Services.');
    }
});

router.post('/stop', requireAuth, (req, res) => {
    try {
        tokenRefreshService.stop();
        logger.info(`⏸️ Token-Refresh-Service gestoppt von: ${req.session.username}`);
        res.redirect('/tokens');
    } catch (error) {
        logger.error('Fehler beim Stoppen des Services:', error);
        res.status(500).send('Fehler beim Stoppen des Services.');
    }
});

module.exports = router;