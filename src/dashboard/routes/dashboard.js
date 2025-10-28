const express = require('express');
const router = express.Router();
function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.redirect('/');
    }
    next();
}

router.get('/', requireAuth, (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Dashboard</title>
            <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-gray-900 text-white min-h-screen">
            <div class="container mx-auto p-8">
                <div class="bg-gray-800 rounded-lg shadow-xl p-8">
                    <h1 class="text-4xl font-bold mb-4 text-purple-400">
                        Willkommen im Dashboard, ${req.session.username || 'Benutzer'}!
                    </h1>
                    <p class="text-gray-400 mb-2">Ihre Twitch ID: <span class="text-white font-mono">${req.session.userId}</span></p>
                    <p class="text-gray-400 mb-6">Session aktiv seit: ${new Date().toLocaleString('de-DE')}</p>
                    
                    <div class="space-x-4">
                        <a href="/auth/logout" class="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-6 rounded transition">
                            🚪 Logout
                        </a>
                    </div>
                </div>
            </div>
        </body>
        </html>
    `);
});

module.exports = router;