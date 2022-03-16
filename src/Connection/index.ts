import { TypedEmitter } from 'tiny-typed-emitter'
import { WebSocket } from 'ws'
import axios from 'axios'

import { ConnectionConfig, ConnectionEvents } from './interface'

export default class nSysConnection extends TypedEmitter<ConnectionEvents> {
    public connected: boolean
    public readonly url: string
    public readonly httpUrl: string
    public readonly clientName: string | undefined
    public reconnect: ConnectionConfig['reconnect'] | undefined
    private reconnectDefault: number

    private readonly authorization: string
    private ws: WebSocket | null = null
    private payloadQueue: object[] = []
    private isNotReconnect: boolean = false;

    constructor(config: ConnectionConfig) {
        super();
        this.connected = false;
        this.url = `ws${config.secure ? 's' : ''}://${config.host}:${config.port}`
        this.httpUrl = `http${config.secure ? 's' : ''}://${config.host}:${config.port}`
        this.authorization = config.authorization;
        this.clientName = config.clientName || 'nSysLava';
        this.reconnect = config.reconnect;
        this.reconnectDefault = this.reconnect?.retryAmout ?? 99;
    }

    private async ping(): Promise<boolean> {
        const code = await axios.get(this.httpUrl, {
            headers: { authorization: this.authorization }
        }).then(_ => _?.status).catch(e => e.response?.status);
        if (code !== 400) return false;
        return true;
    }

    async connect(userId: string): Promise<void | any> {
        const online = await this.ping();
        if (!online) {
            if (this.reconnect) {
                this.reconnect.retryAmout--
                this.emit('reconnecting', this.reconnect?.retryAmout)
                if (this.reconnect.retryAmout === 0) return this.emit('reconnectingFull');
                await new Promise(resolve => setTimeout(resolve, this.reconnect?.delay ?? 3000));
                return this.connect(userId);  
            }
            return;
        }
        this.ws = new WebSocket(this.url, {
            headers: {
                'Authorization': this.authorization,
                'User-Id': userId,
                'Client-Name': this.clientName
            }
        })
        this.ws.once('open', () => {
            this.connected = true;
            if (this.payloadQueue.length) this.flushQueue();
            if (this.reconnect) this.reconnect.retryAmout = this.reconnectDefault;
            this.emit('connected')
        })
        this.ws.once('close', async () => {
            this.connected = false;
            this.emit('disconnected');
            if (this.reconnect && !this.isNotReconnect) while (this.reconnect?.retryAmout) {
                const online = await this.ping();
                if (online) return this.connect(userId);
                this.emit('reconnecting', this.reconnect?.retryAmout)
                this.reconnect.retryAmout--
                if (this.reconnect.retryAmout === 0) return this.emit('reconnectingFull')
                await new Promise(resolve => setTimeout(resolve, this.reconnect?.delay ?? 3000))
            }
            if (this.isNotReconnect) this.isNotReconnect = false;
        });
        this.ws.on('message', (message: string) => {
            message = JSON.parse(message);
            this.emit('message', message);
        })
    }

    disconnect(): boolean {
        if (!this.ws || !this.connected) return false;
        this.isNotReconnect = true;
        this.ws.close();
        return true
    }

    async send(data: object, promise = false): Promise<void> {
        return new Promise((resolve, reject) => {
            if (this.connected) this.ws?.send(JSON.stringify(data), () => resolve());
            else {
                this.payloadQueue[promise ? 'unshift' : 'push'](data);
                resolve();
            }
        });
    }

    flushQueue(): void {
        if (!this.connected) return;
        for (const payload of this.payloadQueue) {
            this.send(payload);
            this.payloadQueue = this.payloadQueue.filter(p => p !== payload);
        }
    }
}