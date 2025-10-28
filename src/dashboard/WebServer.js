const express = require('express');
const path = require('path');
const logger = require('../utils/logger');
const RouteLoader = require('../handler/RouteLoader');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');

const SESSION_SECRET = process.env.SESSION_SECRET;

class WebServer {
    constructor(port = 3000) {
        this.port = port;
        this.app = express();

        this._setupMiddleware();
        this._setupRoutes();
        this._checkDbConnection();
    }

    _setupMiddleware() {
        this.app.use(express.json());
        this.app.use(express.urlencoded({ extended: true }));
        this.app.use(cookieParser());

        this.app.use(session({
            secret: SESSION_SECRET,
            resave: false,
            saveUninitialized: false,
            cookie: {
                secure: process.env.NODE_ENV === 'production',
                maxAge: 1000 * 60 * 60 * 24 // 24 Stunden
            }
        }));

        this.app.use((req, res, next) => {
            logger.debug(`${req.method} ${req.path} - Session: ${req.session?.userId ? 'angemeldet' : 'nicht angemeldet'}`);
            next();
        });
    }

    _checkDbConnection() {
        if (mongoose.connection.readyState === 1) {
            logger.info('💾 Mongoose-Verbindung ist aktiv (Status 1). Webserver bereit.');
        } else {
            logger.warn('⚠️ Mongoose-Verbindung ist NICHT aktiv (Status: ' + mongoose.connection.readyState + ').');
        }
    }

    _setupRoutes() {
        const routesDirectory = path.join(__dirname, 'routes');
        const routeLoader = new RouteLoader(routesDirectory);

        this.app.use('/', routeLoader.getRouter());

        this.app.use(express.static(path.join(__dirname, 'public')));

        this.app.use((req, res) => {
            logger.warn(`404 - Route nicht gefunden: ${req.method} ${req.path}`);
            res.status(404).send(`
                <!DOCTYPE html>
                <html lang="de">
                <head>
                    <meta charset="UTF-8">
                    <title>404 - Nicht gefunden</title>
                    <script src="https://cdn.tailwindcss.com"></script>
                </head>
                <body class="bg-gray-900 text-white min-h-screen flex items-center justify-center">
                    <div class="text-center">
                        <h1 class="text-6xl font-bold text-red-500 mb-4">404</h1>
                        <p class="text-2xl mb-4">Seite nicht gefunden</p>
                        <p class="text-gray-400 mb-6">Route: ${req.method} ${req.path}</p>
                        <a href="/" class="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded">
                            Zur Startseite
                        </a>
                    </div>
                </body>
                </html>
            `);
        });
    }

    _printRoutes() {
        try {
            const routes = [];

            if (this.app._router && this.app._router.stack) {
                this.app._router.stack.forEach(middleware => {
                    if (middleware.route) {
                        const methods = Object.keys(middleware.route.methods).join(', ').toUpperCase();
                        routes.push(`  ${methods.padEnd(10)} ${middleware.route.path}`);
                    } else if (middleware.name === 'router') {
                        const routerPath = middleware.regexp.toString()
                            .replace('/^', '')
                            .replace('\\/?(?=\\/|$)/i', '')
                            .replace(/\\\//g, '/')
                            .replace(/\\/g, '');

                        if (middleware.handle && middleware.handle.stack) {
                            middleware.handle.stack.forEach(handler => {
                                if (handler.route) {
                                    const methods = Object.keys(handler.route.methods).join(', ').toUpperCase();
                                    const fullPath = routerPath + handler.route.path;
                                    routes.push(`  ${methods.padEnd(10)} ${fullPath || '/'}`);
                                }
                            });
                        }
                    }
                });
            }

            if (routes.length > 0) {
                routes.forEach(route => logger.info(route));
            }

        } catch (error) {
            logger.error('Routen-Debug nicht verfügbar:', error.message);
        }

        logger.info('');
    }

    start() {
        this.app.listen(this.port, () => {
            logger.info(`🌐 Webserver läuft auf http://localhost:${this.port}`);

            if (process.env.DEBUG === 'true') {
                this._printRoutes();
            }
        });
    }
}

module.exports = WebServer;