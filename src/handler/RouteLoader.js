const express = require('express');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

class RouteLoader {
    constructor(routesPath) {
        this.routesPath = routesPath;
        this.mainRouter = express.Router();
        this._loadRoutes();
    }

    _loadRoutes() {
        if (!fs.existsSync(this.routesPath)) {
            logger.error(`❌ Das Routen-Verzeichnis existiert nicht: ${this.routesPath}`);
            return;
        }

        const routeFiles = fs.readdirSync(this.routesPath)
            .filter(file => file.endsWith('.js'));

        if (routeFiles.length === 0) {
            logger.warn('⚠️ Keine Routen-Dateien gefunden in: ' + this.routesPath);
            return;
        }

        for (const file of routeFiles) {
            const routeFilePath = path.join(this.routesPath, file);

            try {
                const route = require(routeFilePath);

                let routeBase = path.basename(file, '.js');
                let routePath;

                if (routeBase === 'index') {
                    routePath = '/';
                } else {
                    routePath = `/${routeBase}`;
                }
                this.mainRouter.use(routePath, route);

            } catch (error) {
                logger.error(`  ❌ Fehler beim Laden von ${file}:`, error.message);
            }
        }

        logger.info(`✨ ${routeFiles.length} Route(n) erfolgreich geladen.\n`);
    }

    getRouter() {
        return this.mainRouter;
    }
}

module.exports = RouteLoader;