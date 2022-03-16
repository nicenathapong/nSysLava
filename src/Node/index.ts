import { TypedEmitter } from 'tiny-typed-emitter'
import nSysConnection from "../Connection";
import axios from "axios";
import { decode } from '@lavalink/encoding'

import { NodeConfig, lavalinkLoadtracks, lavalinkStats, nodeEvents, lavalinkTrack } from "./interface";
import { ConnectionConfig } from "../Connection/interface";
import { nSysPlayer } from "../Player";
import { VoiceUpdate } from "../Player/interface";
import { nSysManager } from '../Manager';

export class nSysNode extends TypedEmitter<nodeEvents> {
    public isConnected: boolean
    public readonly name: string
    public readonly config: NodeConfig
    public readonly info: ConnectionConfig
    public conn: nSysConnection
    public userId: string | null = null;
    public readonly players: Map<string, nSysPlayer> = new Map<string, nSysPlayer>();
    public search: boolean
    public play: boolean
    public stats: lavalinkStats = {
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
    }
    public manager?: nSysManager

    constructor(config: NodeConfig, manager?: nSysManager) {
        super();
        this.isConnected = false;
        this.name = config.name ?? config.host;
        this.config = config;
        this.info = {
            host: config.host,
            port: config.port,
            secure: config.secure,
            authorization: config.authorization,
            clientName: config.clientName,
            reconnect: config.reconnect
        }
        this.conn = new nSysConnection(this.info);

        // handles events from nSysConnection
        this.conn.on('connected', () => {
            this.isConnected = true;
            this.emit('connected');
        });
        this.conn.on('disconnected', () => {
            this.isConnected = false;
            this.emit('disconnected');
        });
        this.conn.on('reconnecting', (retryAmout: number) => this.emit('reconnecting', retryAmout));
        this.conn.on('reconnectingFull', () => this.emit('reconnectingFull'));
        this.conn.on('message', async message => {
            switch (message.op) {
                case 'playerUpdate':
                    const player = this.players.get(message.guildId);
                    if (player) player.position = message.state.position;
                    break;
                case 'stats':
                    return this.stats = message
                case 'event':
                    {
                        if (message.type === 'WebSocketClosedEvent') return;
                        const player = this.players.get(message.guildId);
                        if (!player) return;
                        const track = this.decodeTrack(message.track);
                        switch (message.type) {
                            case 'TrackStartEvent':
                                player.isPlaying = true;
                                return player.emit('TrackStart', track);
                            case 'TrackEndEvent':
                                player.isPlaying = false;
                                if (message.reason !== 'REPLACED') await player.queue.next();
                                return player.emit('TrackEnd', track);
                            case 'TrackExceptionEvent':
                                return player.emit('TrackException', track);
                            case 'TrackStuckEvent':
                                return player.emit('TrackStuckEvent', track);
                        }
                    };
                    break;
            }
        })
        this.search = this.config.search ? true : false
        this.play = this.config.play ? true : false;
        this.manager = manager;
    }

    decodeTrack(track: string): lavalinkTrack {
        const decoded = decode(track)
        return {
            track, info: {
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

    handleVoiceUpdate(update: VoiceUpdate): void {
        this.players.get(update?.guild_id)?.handleVoiceUpdate(update);
    }

    async connect(userId: string): Promise<void> {
        this.userId = userId;
        this.conn.connect(userId);
    }

    disconnect(): boolean {
        return this.conn.disconnect();
    } 

    createPlater(guildId: string): nSysPlayer | null {
        if (!this.config.play) return null;
        const player = new nSysPlayer(this, guildId, this.manager);
        this.players.set(guildId, player);
        return player;
    }

    getPlayer(guildId: string): nSysPlayer | undefined {
        return this.players.get(guildId);
    }

    async destroyPlayer(guildId: string): Promise<boolean> {
        const player = this.players.get(guildId);
        if (!player) return false;
        await player.destroy();
        this.players.delete(player.guildId);
        return true;
    }

    async loadTracks(search: string): Promise<lavalinkLoadtracks> {
        if (!search.match(/[(http(s)?):\/\/(www\.)?a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/ig)) search = `ytsearch:${search}`;
        return axios.get(`${this.conn.httpUrl}/loadtracks?identifier=${encodeURIComponent(search)}`, {
            headers: { Authorization: this.info.authorization }
        }).then(res => res?.data).catch(() => ({
            playlistInfo: {},
            loadType: 'LOAD_FAILED',
            tracks: []
        }))
    }

    setSeach(bool = true): void {
        this.search = bool;
    }

    setPlay(bool = true): void {
        this.search = bool;
    }
}