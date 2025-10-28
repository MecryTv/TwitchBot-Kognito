const express = require('express');
const path = require('path');
const router = express.Router();

router.get('/', (req, res) => {
    if (req.session && req.session.userId) {
        return res.redirect('/dashboard');
    }

    const filePath = path.join(__dirname, '..', 'public', 'index.html');
    res.sendFile(filePath, (err) => {
        if (err) {
            console.error('Fehler beim Senden der index.html:', err);
            res.status(500).send('Ein interner Fehler ist aufgetreten.');
        }
    });
});

module.exports = router;