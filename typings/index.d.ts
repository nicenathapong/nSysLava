import { TypedEmitter } from 'tiny-typed-emitter'

import {
    ConnectionConfig,
    NodeConfig,
    VoiceUpdate,
    connectOptions,
    lavalinkStats,
    lavalinkLoadtracks,
    lavalinkTrack
} from './interface';

import { loopMode } from './enum'

import {
    ConnectionEvents,
    ManagerEvents,
    NodeEvents,
    PlayerEvents
} from './events'

export class nSysConnection extends TypedEmitter<ConnectionEvents> {
    public connected: boolean
    public readonly url: string
    public readonly httpUrl: string;
    public readonly clientName?: string;
    public reconnect?: ConnectionConfig['reconnect'];
    public constructor(config: ConnectionConfig);
    public connect(userId: string): void;
    public disconnect(): boolean;
    public send(): Promise<void>;
}

export class nSysManager extends TypedEmitter<ManagerEvents> {
    public readonly nodes: Map<string, nSysNode>
    public userId: string | null;
    public constructor(nodes: NodeConfig[]);
    public handleVoiceUpdate(update: VoiceUpdate): void;
    public connect(userId: string): void;
    public createPlater(guildId: string): nSysPlayer | null
    public getPlayer(guildId: string): nSysPlayer | null
    public destroyPlayer(guildId: string): Promise<boolean>
    public getNode(nodeConfig: NodeConfig): nSysNode | undefined
    public addNode(name: string): boolean;
    public deleteNode(name: string): boolean;
    public loadTracks(search: string): Promise<lavalinkLoadtracks>;
}

export class nSysNode extends TypedEmitter<NodeEvents> {
    public isConnected: boolean
    public readonly name: string
    public readonly config: NodeConfig
    public readonly info: ConnectionConfig
    public conn: nSysConnection
    public userId: string | null;
    public readonly players: Map<string, nSysPlayer>
    public search: boolean
    public play: boolean
    public stats: lavalinkStats;
    public manager?: nSysManager;
    constructor(config: NodeConfig, manager?: nSysManager);
    public handleVoiceUpdate(update: VoiceUpdate): void;
    public connect(userId: string): void;
    public disconnect(): boolean;
    public createPlater(guildId: string): nSysPlayer | null;
    public getPlayer(guildId: string): nSysPlayer | undefined;
    public destroyPlayer(guildId: string): Promise<boolean>;
    public loadTracks(search: string): Promise<lavalinkLoadtracks>
}

export class nSysPlayer extends TypedEmitter<PlayerEvents> {
    public readonly queue: nSysQueue;
    public readonly node: nSysNode
    public readonly userId: string | null;
    public readonly guildId: string
    public channelId: string | null
    public isPlaying: boolean
    public position: number;
    public isPaused: boolean;
    public manager?: nSysManager;
    constructor(node: nSysNode, guildId: string, manager?: nSysManager);
    public handleVoiceUpdate(payload: VoiceUpdate): void
    public connect(channelId: string | null, options?: connectOptions): this;
    public disconnect(): this;
    public play(track: string | { track: string }): Promise<this>;
    public stop(): Promise<this>;
    public setPause(pause: boolean = true): Promise<this>;
    public resume(): Promise<this>;
    public seek(position: number): Promise<this>;
    public destroy(): Promise<this>;
    public setVolume(volume: number): Promise<this>;
}

export class nSysQueue {
    public player: nSysPlayer;
    public previous: lavalinkTrack[]
    public current: lavalinkTrack | null
    public tracks: lavalinkTrack[]
    public loop: loopMode
    public isAutoplay: boolean;
    constructor(player: nSysPlayer);
    public add(tracks: lavalinkTrack | lavalinkTrack[], requester?: string): boolean;
    public start(): Promise<boolean>;
    public skip(): Promise<void>;
    public toPrevious(): Promise<boolean>;
    public skipTo(index: number): void;
    public clear(): boolean;
    public shuffle(): boolean;
    public setLoop(loop = loopMode.NONE): boolean;
    public setAutoplay(bool = true): void;
}