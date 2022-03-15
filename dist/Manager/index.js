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
exports.nSysManager = void 0;
const tiny_typed_emitter_1 = require("tiny-typed-emitter");
const Node_1 = require("../Node");
class nSysManager extends tiny_typed_emitter_1.TypedEmitter {
    constructor(nodes) {
        super();
        this.nodes = new Map(nodes.map(node => {
            var _a;
            return ([
                (_a = node === null || node === void 0 ? void 0 : node.name) !== null && _a !== void 0 ? _a : node === null || node === void 0 ? void 0 : node.host,
                new Node_1.nSysNode(node)
            ]);
        }));
        this.userId = null;
        // handles events from nodes
        Array.from(this.nodes.values()).forEach(node => this.handlesNodeEvents(node));
    }
    handlesNodeEvents(node) {
        node.on('sendGatewayPayload', (guildId, payload) => this.emit('sendGatewayPayload', guildId, payload));
        node.on('connected', () => this.emit('nodeConnect', node));
        node.on('disconnected', () => this.emit('nodeDisconnect', node));
        node.on('reconnecting', retryAmout => this.emit('nodeReconnecting', node, retryAmout));
        node.on('reconnectingFull', () => this.emit('nodeReconnectingFull', node));
    }
    handleVoiceUpdate(update) {
        const node = Array.from(this.nodes.values()).find(node => node.players.get(update === null || update === void 0 ? void 0 : update.guild_id));
        if (node)
            node.handleVoiceUpdate(update);
    }
    connect(userId) {
        this.userId = userId;
        Array.from(this.nodes.values()).forEach(node => node.connect(userId));
    }
    createPlater(guildId) {
        const node = Array.from(this.nodes.values()).filter(node => node.isConnected || (node.play || node.play === undefined)).sort((a, b) => a.players.size - b.players.size).at(0);
        if (!node)
            return null;
        return node.createPlater(guildId);
    }
    getPlayer(guildId) {
        const node = Array.from(this.nodes.values()).find(node => Array.from(node.players.values()).find(player => player.guildId === guildId));
        if (!node)
            return null;
        return node.getPlayer(guildId);
    }
    destroyPlayer(guildId) {
        return __awaiter(this, void 0, void 0, function* () {
            const node = Array.from(this.nodes.values()).find(node => Array.from(node.players.values()).find(player => player.guildId === guildId));
            if (!node)
                return false;
            const player = node.getPlayer(guildId);
            if (!player)
                return false;
            player.disconnect();
            yield player.destroy();
            node.destroyPlayer(player.guildId);
            return true;
        });
    }
    getNode(name) {
        return this.nodes.get(name);
    }
    addNode(nodeConfig) {
        const node = new Node_1.nSysNode(nodeConfig);
        this.handlesNodeEvents(node);
        this.nodes.set(node.name, node);
        return node;
    }
    deleteNode(name) {
        const node = this.nodes.get(name);
        if (!node)
            return false;
        this.nodes.delete(node.name);
        return true;
    }
    loadTracks(search) {
        return __awaiter(this, void 0, void 0, function* () {
            const nodes = Array.from(this.nodes.values()).filter(node => node.isConnected && (node.play || node.search === undefined));
            let node = nodes.find(Boolean);
            if (!node)
                return {
                    loadType: 'LOAD_FAILED',
                    playlistInfo: {},
                    tracks: []
                };
            return node.loadTracks(search);
        });
    }
}
exports.nSysManager = nSysManager;
