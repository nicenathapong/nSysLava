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
Object.defineProperty(exports, "__esModule", { value: true });
exports.nSysPlayer = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const Queue_1 = require("../Queue");
class nSysPlayer extends tiny_typed_emitter_1.TypedEmitter {
    constructor(node, guildId, manager) {
        super();
        this.queue = new Queue_1.nSysQueue(this);
        this.node = node;
        this.userId = node.userId;
        this.guildId = guildId;
        this.channelId = null;
        this.isPlaying = false;
        this.position = 0;
        this.isPaused = false;
        this.voiceState = {};
        this.manager = manager;
        // if (this.manager) this.manager.loadTracks('https://cdn.discordapp.com/attachments/828651362093891605/951606009577738350/nSysClientIsPlayingNow.mp3').then(res => this.queue.add(res.tracks[0]));
    }
    handleVoiceUpdate(payload) {
        var _a;
        if (Object.keys(payload).includes('token')) {
            this.voiceState.event = payload;
        }
        else {
            if (payload.user_id !== this.node.userId)
                return;
            this.voiceState.sessionId = payload.session_id;
            if (!payload.channel_id && this.channelId) { // channelLeave
                this.channelId = null;
                this.voiceState = {};
            }
            else if (payload.channel_id && this.channelId) { // channelJoin
                this.channelId = payload.channel_id;
            }
            else if (payload.channel_id !== this.channelId) { // channelMove
                this.channelId = (_a = payload.channel_id) !== null && _a !== void 0 ? _a : null;
            }
            if (this.voiceState.sessionId === payload.session_id)
                return;
            this.voiceState.sessionId = payload.session_id;
        }
        if (this.voiceState.event && this.voiceState.sessionId) {
            this.node.conn.send(Object.assign({ op: 'voiceUpdate', guildId: this.guildId }, this.voiceState));
        }
    }
    connect(channelId, options) {
        var _a, _b;
        this.voiceState = {};
        this.channelId = channelId;
        this.node.emit('sendGatewayPayload', this.guildId, {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: this.channelId,
                self_deaf: (_a = options === null || options === void 0 ? void 0 : options.deafened) !== null && _a !== void 0 ? _a : false,
                self_mute: (_b = options === null || options === void 0 ? void 0 : options.muted) !== null && _b !== void 0 ? _b : false
            }
        });
        return this;
    }
    disconnect() {
        this.voiceState = {};
        this.connect(null);
        this.node.conn.send({
            op: 'destroy',
            guildId: this.guildId
        });
        return this;
    }
    play(track) {
        return __awaiter(this, void 0, void 0, function* () {
            if (typeof track !== 'string')
                track = track.track;
            yield this.node.conn.send({
                op: 'play',
                guildId: this.guildId,
                track
            }, true);
            yield this.seek(0);
            return this;
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.node.conn.send({
                op: 'stop',
                guildId: this.guildId
            }, true);
            return this;
        });
    }
    setPause(pause = true) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.node.conn.send({
                op: 'pause',
                guildId: this.guildId,
                pause
            }, true);
            this.isPaused = pause;
            return this;
        });
    }
    resume() {
        return this.setPause(false);
    }
    seek(position) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.node.conn.send({
                op: 'seek',
                guildId: this.guildId,
                position
            }, true);
            return this;
        });
    }
    destroy() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.node.conn.send({
                op: 'destroy',
                guildId: this.guildId
            });
            return this;
        });
    }
    setVolume(volume) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.node.conn.send({
                op: 'volume',
                guildId: this.guildId,
                volume
            });
            return this;
        });
    }
}
exports.nSysPlayer = nSysPlayer;
