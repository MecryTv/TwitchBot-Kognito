const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const logger = require('../../utils/logger');

function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        logger.warn('⚠️ Unauthorized access attempt to dashboard');
        return res.redirect('/');
    }
    next();
}

router.get('/', requireAuth, (req, res) => {
    const dashboardData = {
        username: req.session.username || 'Unbekannt',
        userId: req.session.userId,
        displayName: req.session.displayName || req.session.username || 'Benutzer'
    };

    const filePath = path.join(__dirname, '..', 'public', 'html', 'dashboard.html');

    fs.readFile(filePath, 'utf8', (err, html) => {
        if (err) {
            logger.error('Fehler beim Lesen der Dashboard.html:', err);
            return res.status(500).send('Ein interner Fehler ist aufgetreten.');
        }

        const injectedHtml = html.replace(
            '</head>',
            `<script>window.dashboardData = ${JSON.stringify(dashboardData)};</script></head>`
        );

        res.send(injectedHtml);
    });
});

module.exports = router;