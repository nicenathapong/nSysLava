import { TypedEmitter } from 'tiny-typed-emitter'
import { nSysManager } from '../Manager';

import { nSysNode } from "../Node";
import { nSysQueue } from "../Queue";
import { playerEvents, VoiceUpdate, connectOptions } from "./interface";

export class nSysPlayer extends TypedEmitter<playerEvents> {
    public readonly queue: nSysQueue;
    public readonly node: nSysNode
    public readonly userId: string | null;
    public readonly guildId: string
    public channelId: string | null
    public isPlaying: boolean
    public position: number;
    public isPaused: boolean;
    
    public manager?: nSysManager

    private voiceState: Record<string, any>

    constructor(node: nSysNode, guildId: string, manager?: nSysManager) {
        super();
        this.queue = new nSysQueue(this);
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

    handleVoiceUpdate(payload: VoiceUpdate): void {
        if (Object.keys(payload).includes('token')) {
            this.voiceState.event = payload;
        } else {
            if (payload.user_id !== this.node.userId) return;
            this.voiceState.sessionId = payload.session_id;
            if (!payload.channel_id && this.channelId) { // channelLeave
                this.channelId = null;
                this.voiceState = {};
            } else if (payload.channel_id && this.channelId) { // channelJoin
                this.channelId = payload.channel_id
            } else if (payload.channel_id !== this.channelId) { // channelMove
                this.channelId = payload.channel_id ?? null;
            }
            if (this.voiceState.sessionId === payload.session_id) return;
            this.voiceState.sessionId = payload.session_id;
        }
        if (this.voiceState.event && this.voiceState.sessionId) {
            this.node.conn.send({
                op: 'voiceUpdate',
                guildId: this.guildId,
                ...this.voiceState
            })
        }
    }

    connect(channelId: string | null, options?: connectOptions): this {
        this.voiceState = {};
        this.channelId = channelId;
        this.node.emit('sendGatewayPayload', this.guildId, {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: this.channelId,
                self_deaf: options?.deafened ?? false,
                self_mute: options?.muted ?? false
            }
        });
        return this;
    }

    disconnect(): this {
        this.voiceState = {};
        this.connect(null)
        this.node.conn.send({
            op: 'destroy',
            guildId: this.guildId
        });
        return this
    }

    async play(track: string | { track: string }): Promise<this> {
        if (typeof track !== 'string') track = track.track;
        await this.node.conn.send({
            op: 'play',
            guildId: this.guildId,
            track
        }, true);
        await this.seek(0);
        
        return this;
    }

    async stop(): Promise<this> {
        await this.node.conn.send({
            op: 'stop',
            guildId: this.guildId
        }, true)
        return this;
    }
    
    async setPause(pause: boolean = true): Promise<this> {
        await this.node.conn.send({
            op: 'pause',
            guildId: this.guildId,
            pause
        }, true)
        this.isPaused = pause;
        return this;
    }

    resume(): Promise<this> {
        return this.setPause(false);
    }

    async seek(position: number): Promise<this> {
        await this.node.conn.send({
            op: 'seek',
            guildId: this.guildId,
            position
        }, true)
        return this;
    }

    async destroy(): Promise<this> {
        await this.node.conn.send({
            op: 'destroy',
            guildId: this.guildId
        });
        return this;
    }

    async setVolume(volume: number): Promise<this> {
        await this.node.conn.send({
            op: 'volume',
            guildId: this.guildId,
            volume
        });
        return this;
    }
}