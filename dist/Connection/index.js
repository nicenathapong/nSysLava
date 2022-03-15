"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const ws_1 = require("ws");
const axios_1 = __importDefault(require("axios"));
class nSysConnection extends tiny_typed_emitter_1.TypedEmitter {
    constructor(config) {
        var _a, _b;
        super();
        this.connected = false;
        this.url = `ws${config.secure ? 's' : ''}://${config.host}:${config.port}`;
        this.httpUrl = `http${config.secure ? 's' : ''}://${config.host}:${config.port}`;
        this.authorization = config.authorization;
        this.clientName = config.clientName || 'nSysClient';
        this.reconnect = config.reconnect;
        this.reconnectDefault = (_b = (_a = this.reconnect) === null || _a === void 0 ? void 0 : _a.retryAmout) !== null && _b !== void 0 ? _b : 99;
        this.ws = null;
        this.payloadQueue = [];
    }
    connect(userId) {
        this.ws = new ws_1.WebSocket(this.url, {
            headers: {
                'Authorization': this.authorization,
                'User-Id': userId,
                'Client-Name': this.clientName
            }
        });
        this.ws.once('open', () => {
            this.connected = true;
            if (this.payloadQueue.length)
                this.flushQueue();
            if (this.reconnect)
                this.reconnect.retryAmout = this.reconnectDefault;
            this.emit('connected');
        });
        this.ws.once('close', () => __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            this.connected = false;
            this.emit('disconnected');
            if (this.reconnect)
                while ((_a = this.reconnect) === null || _a === void 0 ? void 0 : _a.retryAmout) {
                    const ping = yield axios_1.default.get(this.httpUrl).catch(e => { var _a; return (_a = e.response) === null || _a === void 0 ? void 0 : _a.status; });
                    if (ping)
                        return this.connect(userId);
                    this.emit('reconnecting', (_b = this.reconnect) === null || _b === void 0 ? void 0 : _b.retryAmout);
                    this.reconnect.retryAmout--;
                    if (this.reconnect.retryAmout === 0)
                        return this.emit('reconnectingFull');
                    yield new Promise(resolve => { var _a; return setTimeout(resolve, (_a = this.reconnect) === null || _a === void 0 ? void 0 : _a.delay); });
                }
        }));
        this.ws.on('message', (message) => {
            message = JSON.parse(message);
            this.emit('message', message);
        });
    }
    disconnect() {
        if (this.ws && this.connected) {
            this.ws.close();
            return true;
        }
        return false;
    }
    send(data, promise = false) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                var _a;
                if (this.connected)
                    (_a = this.ws) === null || _a === void 0 ? void 0 : _a.send(JSON.stringify(data), () => resolve());
                else {
                    this.payloadQueue[promise ? 'unshift' : 'push'](data);
                    resolve();
                }
            });
        });
    }
    flushQueue() {
        if (!this.connected)
            return;
        for (const payload of this.payloadQueue) {
            this.send(payload);
            this.payloadQueue = this.payloadQueue.filter(p => p !== payload);
        }
    }
}
exports.default = nSysConnection;
