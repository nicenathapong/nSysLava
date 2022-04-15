import { TypedEmitter } from "tiny-typed-emitter";
import Collection from "@discordjs/collection";
import axios from "axios";
import { decode } from '@lavalink/encoding'

import { nSysConnection } from "./Connection";

import type { nSysManager } from "./Manager";
import type { nSysPlayer } from "./Player";

import type { PingResponseType } from "../interfaces/enums";

import type { INodeEvents } from '../interfaces/events'
import type { INodeConfig } from "../interfaces/config";
import type { ILavalinkStats, ILavalinkLoadtracks, IVoiceUpdate, ILavalinkTrack } from "../interfaces/interfaces";
import type { Snowflake } from "../interfaces/types";

export class nSysNode extends TypedEmitter<INodeEvents> {
    public readonly name: string
    public isConnected: boolean = false;
    public readonly conn: nSysConnection;
    public userId: Snowflake = "";
    public readonly manager: nSysManager
    public readonly players: Collection<string, nSysPlayer> = new Collection<string, nSysPlayer>();
    public isCanSearch: boolean = true;
    public isCanPlay: boolean = true;
    public stats: ILavalinkStats = {
        players: 0,
        playingPlayers: 0,
        uptime: 0,
        cpu: {
            cores: 0,
            lavalinkLoad: 0,
            systemLoad: 0
        },
        memory: {
            allocated: 0,
            free: 0,
            reservable: 0,
            used: 0
        },
        frameStats: {
            deficit: 0,
            nulled: 0,
            sent: 0
        },
    };

    constructor(config: INodeConfig, manager: nSysManager) {
        super();
        this.name = config.name ?? config.host;
        this.conn = new nSysConnection({
            host: config.host,
            port: config.port,
            secure: config.secure,
            authorization: config.authorization,
            clientName: config.clientName,
            reconnect: config.reconnect
        });
        if (!config.search && config.search !== undefined) this.isCanSearch = false;
        if (!config.play && config.play !== undefined) this.isCanSearch = false;
        this.manager = manager;

        // handles conn events
        this.conn.on('wsOpen', () => this._connWsOpen());
        this.conn.on('message', message => this._connOnMessage(message))
        this.conn.on('wsClose', () => this._connWsClose());
        this.conn.on('reconnect', (retryAmout: number) => this._connReconnect(retryAmout));
        this.conn.on('offline', () => this._connOffline());
    };

    handleVoiceUpdate(payload: IVoiceUpdate): void {
        const player = this.players.get(payload?.guild_id);
        if (player) player.handleVoiceUpdate(payload);
    }

    async loadTracks(search: string): Promise<ILavalinkLoadtracks> {
        const { data } = await axios.get(`${this.conn.httpUrl}/loadtracks?identifier=${search}`, {
            headers: { authorization: this.conn.authorization }
        }).catch(() => ({
            data: {
                loadType: 'LOAD_FAILED',
                playlistInfo: {},
                tracks: []
            }
        }));
        return data;
    }

    private _connWsOpen() {
        this.isConnected = true;
        this.emit('connected');
        this.manager.emit('nodeConnect', this);

        if (this.manager.nodes.filter(node => node.isConnected).size && !this.manager.isReady) {
            this.manager.isReady = true;
            this.manager.emit('ready');
        };
        if (this.manager.players.size && this.isCanPlay) {
            this.manager.players.forEach(player => {
                this.players.set(player.guildId, player);
                player.reconnectNode(this);
            });
        }
    }

    private async _connOnMessage(message: any) {
        switch (message.op) {
            case 'playerUpdate': {
                const player = this.players.get(message.guildId);
                if (player) player.position = message.state.position;
            } break;
            case 'stats': {
                this.stats = message;
            } break;
            case 'event': {
                if (message.type === 'WebSocketClosedEvent') return;
                const player = this.players.get(message.guildId);
                if (!player) return;
                const track = this._decodeTrack(message.track);
                if (
                    player.queue.tracks.current?.track === track.track &&
                    player.queue.tracks.current?.info?.requester?.length
                ) track.info.requester = player.queue.tracks.current.info.requester
                switch (message.type) {
                    case 'TrackStartEvent':
                        player.isPlaying = true;
                        player.emit('TrackStart', track);
                        break;
                    case 'TrackEndEvent':
                        player.isPlaying = false;
                        if (message.reason !== 'REPLACED') await player.queue.start();
                        player.emit('TrackEnd', track);
                        break;
                    case 'TrackExceptionEvent':
                        player.emit('TrackException', track);
                        break;
                    case 'TrackStuckEvent':
                        player.emit('TrackStuckEvent', track);
                        break;
                }
            } break;
        }
    }

    private _connWsClose() {
        this.isConnected = false;
        this.emit('disconnected');
        this.manager.emit('nodeDisconnect', this);
        if (this.manager.nodes.filter(node => node.isConnected).size) {
            this.players.forEach(player => {
                const node = this.manager.nodes.filter(node => node.isConnected).sort((a, b) => a.players.size - b.players.size).reverse().at(0);
                if (!node) return;
                player.node = node;
                node.players.set(player.guildId, player);
            });
        } else {
            this.manager.isReady = false;
            this.players.forEach(player => {
                player.node = null;
                this.manager.players.set(player.guildId, player);
            });
        };
        this.players.clear();
        
    }

    private _connReconnect(retryAmout: number) {
        this.emit('reconnecting', retryAmout);
        this.manager.emit('nodeReconnect', this, retryAmout);
    }

    private _connOffline() {
        this.emit('offline');
    }

    private _decodeTrack(track: string): ILavalinkTrack {
        const decoded = decode(track);
        return {
            track,
            info: {
                identifier: decoded.identifier,
                isSeekable: !decoded.isStream,
                author: decoded.author,
                length: Number(decoded.length),
                isStream: decoded.isStream,
                position: Number(decoded.position),
                title: decoded.title,
                uri: decoded.uri ?? '',
                sourceName: decoded.source
            }
        }
    }

    async connect(userId: Snowflake): Promise<PingResponseType> {
        this.userId = userId;
        return this.conn.connect(userId);
    }
}