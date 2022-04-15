import { TypedEmitter } from "tiny-typed-emitter";

import { nSysQueue } from "./Queue";
import type { nSysNode } from "./Node";
import type { nSysManager } from "./Manager";

import { IPlayerEvents } from '../interfaces/events';
import { IPlayerConfig } from "../interfaces/config";
import {
    IVoiceUpdate,
    IPlayerVoiceState,
    IPlayerConnectOptions,
    IGatewayPayload
} from '../interfaces/interfaces';
import { Snowflake } from "../interfaces/types";

export class nSysPlayer extends TypedEmitter<IPlayerEvents> {
    public readonly manager: nSysManager;
    public node: nSysNode | null
    public readonly guildId: Snowflake;
    public channelId: Snowflake | null = null;
    public readonly queue: nSysQueue;
    public isDeafened: boolean = true;
    public isMuted: boolean = true;

    public position: number = 0;
    public isPlaying: boolean = false;
    public isPaused: boolean = false;

    private _voiceState: IPlayerVoiceState = {};
    private readonly _payloadQueue: object[] = [];

    constructor(config: IPlayerConfig) {
        super();
        this.manager = config.manager;
        this.guildId = config.guildId;
        this.node = config.node;
        this.queue = new nSysQueue(this);
    }

    handleVoiceUpdate(payload: IVoiceUpdate): void {
        if (Object.keys(payload).includes('token')) {               // VOICE_STATE_UPDATE
            this._voiceState.event = payload;
        } else {                                                    // VOICE_SERVER_UPDATE
            if (payload.user_id !== this.manager.userId) return;
            this._voiceState.sessionId = payload.session_id;
            if (!payload.channel_id && this.channelId) {            // channelLeave
                this.channelId = null;
                this._voiceState = {};
                this.emit('channelLeave');
            } else if (payload.channel_id && this.channelId) {      // channelMove
                this.channelId = payload.channel_id
                this.emit('channelJoin');
            } else if (payload.channel_id !== this.channelId) {     // channelJoin
                this.channelId = payload.channel_id ?? null;
                this.emit('channelMove');
            }
            this._voiceState.sessionId = payload.session_id;
        }
        if (this._voiceState.event && this._voiceState.sessionId && this.node) {
            this.node.conn.send({
                op: 'voiceUpdate',
                guildId: this.guildId,
                ...this._voiceState
            })
        }
    }

    connect(channelId: Snowflake | null, options?: IPlayerConnectOptions): this {
        this.isDeafened = options?.deafened ? true : false
        this.isMuted = options?.muted ? true : false;
        const data: IGatewayPayload = {
            op: 4,
            d: {
                guild_id: this.guildId,
                channel_id: channelId,
                self_deaf: this.isDeafened,
                self_mute: this.isMuted
            }
        }
        this.manager.emit('sendGatewayPayload', this.guildId, data);
        return this;
    };

    async disconnect(): Promise<this> {
        this._voiceState = {};
        this.connect(null);
        await this._sendToNode(
            this._createPayload('destroy')
        );
        return this;
    }

    async play(track: string | { track: string }, startTime: number = 0): Promise<this> {
        if (typeof track !== 'string') track = track.track;
        await this._sendToNode(
            this._createPayload('play', {
                track,
                startTime
            })
        )
        return this;
    }

    async stop(): Promise<this> {
        await this._sendToNode(
            this._createPayload('stop')
        )
        return this;
    }

    async setPause(pause: boolean): Promise<this> {
        await this._sendToNode(
            this._createPayload('pause', {
                pause
            })
        );
        return this;
    }

    async seek(position: number): Promise<this> {
        await this._sendToNode(
            this._createPayload('seek', {
                position
            })
        );
        return this;
    }

    async destroy(): Promise<this> {
        await this._sendToNode(
            this._createPayload('destroy')
        );
        return this;
    }

    async setVolume(volume: number): Promise<this> {
        await this._sendToNode(
            this._createPayload('volume', {
                volume
            })
        );
        return this;
    }

    reconnectNode(node: nSysNode): void {
        this.node = node;
        if (this.channelId) {
            this.connect(this.channelId);
            if (this.queue.tracks.current) {
                this.play(this.queue.tracks.current.track, this.position);
            }
        }
    }

    private async _sendToNode(object: object): Promise<void> {
        if (!this.node) {
            this._payloadQueue.push(object);
            return;
        }
        await this.node.conn.send(object, true);
        return;
    }

    private _createPayload(op: string, data: object = {}): object {
        return {
            op,
            guildId: this.guildId,
            ...data
        }
    }
}