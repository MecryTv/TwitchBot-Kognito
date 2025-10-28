const fs = require('fs');
const path = require('path');
const util = require('util');

class ChronicleLogger {
    constructor() {
        this.colors = {
            reset: "\x1b[0m",
            bright: "\x1b[1m",
            dim: "\x1b[2m",
            black: "\x1b[30m",
            red: "\x1b[31m",
            green: "\x1b[32m",
            yellow: "\x1b[33m",
            blue: "\x1b[34m",
            magenta: "\x1b[35m",
            cyan: "\x1b[36m",
            white: "\x1b[37m",
            gray: "\x1b[90m",
            bgRed: "\x1b[41m",
            bgGreen: "\x1b[42m",
            bgYellow: "\x1b[43m",
            bgBlue: "\x1b[44m",
            bgMagenta: "\x1b[45m",
            bgCyan: "\x1b[46m",
            bgWhite: "\x1b[47m",
            twitch: "\x1b[38;5;99m",
        };

        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3,
        };

        this.currentLevel = this.levels.DEBUG;

        this.logDirectory = path.join(__dirname, '..', '..', 'logs');
        this.archiveDirectory = path.join(this.logDirectory, 'archive');
        this.logFilePath = path.join(this.logDirectory, 'session.log');
        this.logLineLimit = 10000;
        this.lineCount = 0;
        this.writeStream = null;

        this._initialize();
    }

    /**
     * @private
     */
    async _initialize() {
        try {
            if (!fs.existsSync(this.logDirectory)) fs.mkdirSync(this.logDirectory, { recursive: true });
            if (!fs.existsSync(this.archiveDirectory)) fs.mkdirSync(this.archiveDirectory, { recursive: true });

            if (fs.existsSync(this.logFilePath)) {
                const data = fs.readFileSync(this.logFilePath, 'utf8');
                this.lineCount = data.split('\n').length - 1;
            }

            this.writeStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
        } catch (err) {
            console.error("Fehler bei der Initialisierung des Chronicle Loggers:", err);
        }
    }

    /**
     * Ermittelt den Dateinamen der Datei, die die Log-Funktion aufgerufen hat, über den Stack Trace.
     * @returns {string} - Der Basis-Dateiname.
     * @private
     */
    _getCallerFileName() {
        // Speichere die originale Funktion
        const originalPrepareStackTrace = Error.prepareStackTrace;
        // Ersetze die Funktion, um das Stack-Array zu erhalten
        Error.prepareStackTrace = (_, stack) => stack;

        const err = new Error();
        // Index 4 sollte normalerweise die Datei sein, die die Logger-Wrapper-Funktion aufruft
        const callerFrame = err.stack[4];

        // Stelle die originale Funktion wieder her
        Error.prepareStackTrace = originalPrepareStackTrace;

        if (callerFrame) {
            const filePath = callerFrame.getFileName();
            // Gibt nur den Basis-Dateinamen zurück (z.B. 'index.js')
            return filePath ? path.basename(filePath) : 'Unknown';
        }
        return 'Unknown';
    }


    /**
     * @private
     */
    async _rotateLog() {
        if (this.lineCount >= this.logLineLimit && fs.existsSync(this.logFilePath)) {
            const timestamp = new Date().toISOString().replace(/:/g, '-').replace('T', '_').split('.')[0];
            const archivePath = path.join(this.archiveDirectory, `${timestamp}.log`);

            if (this.writeStream) {
                this.writeStream.end();
            }

            await fs.promises.rename(this.logFilePath, archivePath);

            this.writeStream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
            this.lineCount = 0;

            const message = `📜 Log-Archiv erstellt: ${path.basename(archivePath)}`;
            // Da _rotateLog im Hintergrund läuft, rufen wir hier info() auf, das dann log() und somit die Dateinamen-Erkennung nutzt.
            this.info(message);
        }
    }

    /**
     * @param {string} formattedMessage - Die bereits formatierte Nachricht.
     * @param  {...any} args - Zusätzliche Argumente.
     * @private
     */
    _writeToFile(formattedMessage, ...args) {
        if (!this.writeStream) return;
        const cleanMessage = formattedMessage.replace(/\x1b\[[0-9;]*m/g, '');
        const additionalArgs = args.length > 0 ? `\n${util.format(...args)}` : '';

        this.writeStream.write(`${cleanMessage}${additionalArgs}\n`, (err) => {
            if (err) console.error("Fehler beim Schreiben in die Log-Datei:", err);
        });

        this.lineCount++;
        this._rotateLog();
    }

    getTimestamp() {
        const now = new Date();
        const date = now.toLocaleDateString("de-DE");
        const time = now.toLocaleTimeString("de-DE", {
            hour12: false,
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
        return `${date} ${time}`;
    }

    /**
     * @param {string} level - Der Log-Level (z.B. 'INFO').
     * @param {string} message - Die eigentliche Nachricht.
     * @param {string} color - Der ANSI-Farbcode für den Level.
     * @param {string} fileName - Der Name der aufrufenden Datei (NEU).
     */
    formatMessage(level, message, color, fileName) {
        const timestamp = this.getTimestamp();
        const filePart = fileName ? `${this.colors.gray}[${fileName}]${this.colors.reset} ` : '';

        return `${filePart}${this.colors.gray}[${timestamp}]${this.colors.reset} ${color}[${level}]${this.colors.reset} | ${message}`;
    }

    log(level, message, color, ...args) {
        const upperLevel = level.toUpperCase();
        if (this.currentLevel >= (this.levels[upperLevel] || this.levels.INFO)) {
            const fileName = this._getCallerFileName();

            const formatted = this.formatMessage(upperLevel, message, color, fileName);

            const consoleMethod = upperLevel === 'ERROR' ? console.error : (upperLevel === 'WARN' ? console.warn : console.log);
            consoleMethod(formatted, ...args);
            this._writeToFile(formatted, ...args);
        }
    }

    info(message, ...args) { this.log('info', message, this.colors.green, ...args); }
    error(message, ...args) { this.log('error', message, this.colors.red, ...args); }
    warn(message, ...args) { this.log('warn', message, this.colors.yellow, ...args); }
    debug(message, ...args) { this.log('debug', message, this.colors.blue, ...args); }
    success(message, ...args) { this.log('✓', message, `${this.colors.bright}${this.colors.green}`, ...args); }
    server(message, ...args) { this.log('server', message, this.colors.cyan, ...args); }
    user(message, ...args) { this.log('user', message, this.colors.magenta, ...args); }
    twitch(message, ...args) { this.log('twitch', message, this.colors.twitch, ...args); }

    guardian(type, message, ...args) {
        const upperType = type.toUpperCase();
        let color = this.colors.cyan;
        if (upperType === "WARN") color = this.colors.yellow;
        else if (upperType === "ERROR") color = this.colors.red;
        this.log('guardian', `${upperType.padEnd(5)} | ${message}`, color, ...args);
    }

    http(method, url, status, ...args) {
        let color = this.colors.blue;
        if (status >= 200 && status < 300) color = this.colors.green;
        else if (status >= 400) color = this.colors.red;
        const message = `${method.padEnd(6)} ${url} → ${status}`;
        this.log('http', message, color, ...args);
    }

    session(type) {
        const border = "=".repeat(50);
        const message = type === 'start' ? "BOT SESSION STARTED" : "BOT SESSION ENDED";
        const logMessage = `\n${border}\n[${this.getTimestamp()}] ${message}\n${border}\n`;
        console.log(this.colors.cyan + logMessage + this.colors.reset);
        this._writeToFile(logMessage.replace(/\x1b\[[0-9;]*m/g, ''));
    }

    trace(functionName, step, data) {
        if (this.currentLevel >= this.levels.DEBUG) {
            const message = `[${functionName}] -> ${step}`;
            // NEU: Dateinamen abrufen und an formatMessage übergeben
            const fileName = this._getCallerFileName();
            const formatted = this.formatMessage("TRACE", message, this.colors.magenta, fileName);
            console.log(formatted);
            this._writeToFile(formatted, data ? JSON.stringify(data, null, 2) : '');
        }
    }

    mtvBanner(color = this.colors.cyan) {
        const mtvLogo = [
            "███╗   ███╗████████╗██╗   ██╗",
            "████╗ ████║╚══██╔══╝██║   ██║",
            "██╔████╔██║   ██║   ██║   ██║",
            "██║╚██╔╝██║   ██║   ╚██╗ ██╔╝",
            "██║ ╚═╝ ██║   ██║    ╚████╔╝ ",
            "╚═╝     ╚═╝   ╚═╝     ╚═══╝  ",
        ];

        console.log();
        console.log(`${this.colors.bright}${color}${"▓".repeat(50)}${this.colors.reset}`);
        console.log();

        mtvLogo.forEach((line, index) => {
            const logoColor = index < 3 ? `${this.colors.bright}${color}` : color;
            console.log(`${logoColor}    ${line}${this.colors.reset}`);
        });

        console.log();
        console.log(`${this.colors.bright}${color}    ┌─────────────────────────────────────┐${this.colors.reset}`);
        console.log(`${color}    │  ${this.colors.bright}⭐️ Version:${this.colors.reset}${color} 1.0.0                  │${this.colors.reset}`);
        console.log(`${color}    │  ${this.colors.bright}⚡️ Engine:${this.colors.reset}${color} Node.js + Twurple.js    │${this.colors.reset}`);
        console.log(`${color}    │  ${this.colors.bright}💻 Developer:${this.colors.reset}${color} MecryTv              │${this.colors.reset}`);
        console.log(`${this.colors.bright}${color}    └─────────────────────────────────────┘${this.colors.reset}`);
        console.log();
        console.log(`${this.colors.bright}${color}${"▓".repeat(50)}${this.colors.reset}`);
        console.log();
    }

    banner(message, color = this.colors.cyan) {
        const border = "=".repeat(message.length + 4);
        console.log(`${color}${border}\n  ${message}  \n${border}${this.colors.reset}`);
    }

    box(message, color = this.colors.blue) {
        const lines = message.split("\n");
        const maxLength = Math.max(...lines.map((line) => line.length));
        const border = "─".repeat(maxLength + 2);
        console.log(`${color}┌${border}┐`);
        lines.forEach((line) => console.log(`│ ${line}${" ".repeat(maxLength - line.length)} │`));
        console.log(`└${border}┘${this.colors.reset}`);
    }

    setLevel(level) {
        if (typeof level === "string" && this.levels[level.toUpperCase()] !== undefined) {
            this.currentLevel = this.levels[level.toUpperCase()];
        }
    }

    table(data, title = null) {
        if (title) this.info(`📊 ${title}`);
        console.table(data);
    }
}

const logger = new ChronicleLogger();
module.exports = logger;
