import { TypedEmitter } from "tiny-typed-emitter";
import { WebSocket } from 'ws'
import axios from 'axios'

import { PingResponseType } from '../interfaces/enums'

import type { IConnectionEvents } from '../interfaces/events'
import type { IConnectionConfig } from '../interfaces/config'
import type { Snowflake } from "../interfaces/types";

export class nSysConnection extends TypedEmitter<IConnectionEvents> {
    public isOpen: boolean = false;
    public readonly wsUrl: string;
    public readonly httpUrl: string;
    public userId: string = "";
    public readonly authorization: string;
    public readonly clientName: string;
    public readonly reconnect: IConnectionConfig['reconnect'];

    private _ws: WebSocket | null = null;
    private readonly _payloadQueue: object[] = [];

    constructor(config: IConnectionConfig) {
        super();
        this.wsUrl = `ws${config.secure ? 's' : ''}://${config.host}:${config.port}`;
        this.httpUrl = `http${config.secure ? 's' : ''}://${config.host}:${config.port}`;
        this.authorization = config.authorization;
        this.clientName = config.clientName ?? 'nSysLava'
        this.reconnect = config.reconnect ?? {
            retryAmout: 0,
            delay: 0
        }
    }

    private async _ping(): Promise<PingResponseType> {
        const responseCode = await axios.get(this.httpUrl, {
            headers: { authorization: this.authorization }
        }).then(_ => _?.status).catch(e => e.response?.status);
        switch (responseCode) {
            case 400:
                return PingResponseType.ONLINE;
            case 401:
                return PingResponseType.AUTHORIZATION_FAIL;
            case undefined: default:
                return PingResponseType.TIME_OUT;
        }
    }

    async connect(userId: Snowflake): Promise<PingResponseType> {
        this.userId = userId;
        const ping = await this._ping();
        switch (ping) {
            case PingResponseType.AUTHORIZATION_FAIL:
                return ping;
            case PingResponseType.TIME_OUT:
                return ping;
        };
        this._ws = new WebSocket(this.wsUrl, {
            headers: {
                'Authorization': this.authorization,
                'User-Id': this.userId,
                'Client-Name': this.clientName
            }
        });
        this._ws.on('open', () => this._wsOpen());
        this._ws.on('message', (data: string) => this._wsOnMessage(data))
        this._ws.on('close', () => this._wsClose());
        return ping;
    };

    private _wsOpen(): void {
        this.isOpen = true;
        if (this._payloadQueue.length) this.flushQueue();
        this.emit('wsOpen');
    }

    private _wsOnMessage(data: string) {
        data = JSON.parse(data);
        this.emit('message', data);
    }

    private async _wsClose(): Promise<void> {
        this.isOpen = false;
        this.emit('wsClose');
        if (this.reconnect?.retryAmout) {
            while (this.reconnect.retryAmout) {
                const ping = await this._ping();
                if (ping === PingResponseType.ONLINE) {
                    this.connect(this.userId);
                    return;
                }
                this.emit('reconnect', this.reconnect.retryAmout);
                this.reconnect.retryAmout--
                if (!this.reconnect.retryAmout) {
                    this.emit('offline');
                    return;
                }
                await new Promise(resolve => setTimeout(resolve, this.reconnect?.delay ?? 3000));
            }
        }
    }

    async send(data: object, promise: boolean = false): Promise<void> {
        return new Promise(resolve => {
            if (this.isOpen && this._ws) this._ws.send(JSON.stringify(data), () => resolve());
            else {
                this._payloadQueue[promise ? 'unshift' : 'push'](data);
                resolve();
            }
        })
    }

    disconnect(): boolean {
        if (!this._ws || !this.isOpen) return false;
        this._ws.close();
        return true;
    }

    flushQueue(): boolean {
        if (!this._payloadQueue.length) return false;
        for (const payload of this._payloadQueue) {
            this.send(payload);
            this._payloadQueue.shift();
        }
        return true;
    }
}