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
exports.nSysNode = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const Connection_1 = __importDefault(require("../Connection"));
const axios_1 = __importDefault(require("axios"));
const encoding_1 = require("@lavalink/encoding");
const Player_1 = require("../Player");
class nSysNode extends tiny_typed_emitter_1.TypedEmitter {
    constructor(config, manager) {
        var _a;
        super();
        this.isConnected = false;
        this.name = (_a = config.name) !== null && _a !== void 0 ? _a : config.host;
        this.config = config;
        this.info = {
            host: config.host,
            port: config.port,
            secure: config.secure,
            authorization: config.authorization,
            clientName: config.clientName,
            reconnect: config.reconnect
        };
        this.conn = new Connection_1.default(this.info);
        // handles events from nSysConnection
        this.conn.on('connected', () => {
            this.isConnected = true;
            this.emit('connected');
        });
        this.conn.on('disconnected', () => {
            this.isConnected = false;
            this.emit('disconnected');
        });
        this.conn.on('reconnecting', (retryAmout) => this.emit('reconnecting', retryAmout));
        this.conn.on('reconnectingFull', () => this.emit('reconnectingFull'));
        this.conn.on('message', (message) => __awaiter(this, void 0, void 0, function* () {
            switch (message.op) {
                case 'playerUpdate':
                    const player = this.players.get(message.guildId);
                    if (player)
                        player.position = message.state.position;
                    break;
                case 'stats':
                    return this.stats = message;
                case 'event':
                    {
                        if (message.type === 'WebSocketClosedEvent')
                            return;
                        const player = this.players.get(message.guildId);
                        if (!player)
                            return;
                        const track = this.decodeTrack(message.track);
                        switch (message.type) {
                            case 'TrackStartEvent':
                                player.isPlaying = true;
                                return player.emit('TrackStart', track);
                            case 'TrackEndEvent':
                                player.isPlaying = false;
                                if (message.reason !== 'REPLACED')
                                    yield player.queue.next();
                                return player.emit('TrackEnd', track);
                            case 'TrackExceptionEvent':
                                return player.emit('TrackException', track);
                            case 'TrackStuckEvent':
                                return player.emit('TrackStuckEvent', track);
                        }
                    }
                    ;
                    break;
            }
        }));
        this.userId = null;
        this.players = new Map();
        this.search = this.config.search ? true : false;
        this.play = this.config.play ? true : false;
        this.stats = {
            cpu: {
                cores: 0,
                lavalinkLoad: 0,
                systemLoad: 0
            },
            frameStats: {
                deficit: 0,
                nulled: 0,
                sent: 0
            },
            memory: {
                allocated: 0,
                free: 0,
                reservable: 0,
                used: 0
            },
            players: 0,
            playingPlayers: 0,
            uptime: 0
        };
        this.manager = manager;
    }
    decodeTrack(track) {
        var _a;
        const decoded = (0, encoding_1.decode)(track);
        return {
            track, info: {
                identifier: decoded.identifier,
                isSeekable: !decoded.isStream,
                author: decoded.author,
                length: Number(decoded.length),
                isStream: decoded.isStream,
                position: Number(decoded.position),
                title: decoded.title,
                uri: (_a = decoded.uri) !== null && _a !== void 0 ? _a : '',
                sourceName: decoded.source
            }
        };
    }
    handleVoiceUpdate(update) {
        var _a;
        (_a = this.players.get(update === null || update === void 0 ? void 0 : update.guild_id)) === null || _a === void 0 ? void 0 : _a.handleVoiceUpdate(update);
    }
    connect(userId) {
        this.userId = userId;
        this.conn.connect(userId);
    }
    disconnect() {
        return this.conn.disconnect();
    }
    createPlater(guildId) {
        if (!this.config.play)
            return null;
        const player = new Player_1.nSysPlayer(this, guildId, this.manager);
        this.players.set(guildId, player);
        return player;
    }
    getPlayer(guildId) {
        return this.players.get(guildId);
    }
    destroyPlayer(guildId) {
        return __awaiter(this, void 0, void 0, function* () {
            const player = this.players.get(guildId);
            if (!player)
                return false;
            yield player.destroy();
            this.players.delete(player.guildId);
            return true;
        });
    }
    loadTracks(search) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!search.match(/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig))
                search = `ytsearch:${search}`;
            return axios_1.default.get(`${this.conn.httpUrl}/loadtracks?identifier=${encodeURIComponent(search)}`, {
                headers: { Authorization: this.info.authorization }
            }).then(res => res === null || res === void 0 ? void 0 : res.data).catch(() => ({
                playlistInfo: {},
                loadType: 'LOAD_FAILED',
                tracks: []
            }));
        });
    }
    setSeach(bool = true) {
        this.search = bool;
    }
    setPlay(bool = true) {
        this.search = bool;
    }
}
exports.nSysNode = nSysNode;
