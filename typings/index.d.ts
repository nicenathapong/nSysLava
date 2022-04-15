import type { TypedEmitter } from 'tiny-typed-emitter'
import type Collection from '@discordjs/collection';

import type {
    IConnectionEvents,
    INodeEvents,
    IManagerEvents,
    IPlayerEvents
} from './events';

import type {
    IConnectionConfig,
    INodeConfig,
    IManagerConfig,
    IPlayerConfig,
    IQueueConfig,
} from './config';

import type {
    ILavalinkStats,
    ILavalinkLoadtracks,
    IVoiceUpdate,
    IPlayerConnectOptions,
    ILavalinkTrack,
} from './interfaces'

import type { PingResponseType } from './enums';

import type { Snowflake } from './types'

export class nSysConnection extends TypedEmitter<IConnectionEvents> {
    isOpen: boolean;
    readonly wsUrl: string;
    readonly httpUrl: string;
    userId: string;
    readonly authorization: string;
    readonly clientName: string;
    readonly reconnect: IConnectionConfig['reconnect'];
    constructor(config: IConnectionConfig)
    async connect(userId: Snowflake): Promise<PingResponseType>;
    async send(data: object, promise: boolean): Promise<void>;
    disconnect(): boolean;
    flushQueue(): boolean;
}

export class nSysNode extends TypedEmitter<INodeEvents> {
    readonly name: string
    isConnected: boolean;
    readonly conn: nSysConnection;
    userId: Snowflake;
    readonly manager: nSysManager;
    readonly players: Collection<string, nSysPlayer>;
    isCanSearch: boolean;
    isCanPlay: boolean;
    stats: ILavalinkStats;
    constructor(config: INodeConfig, manager: nSysManager);
    handleVoiceUpdate(payload: IVoiceUpdate): void;
    async loadTracks(search: string): Promise<ILavalinkLoadtracks>;
    async connect(userId: Snowflake): Promise<PingResponseType>;
}

export class nSysManager extends TypedEmitter<IManagerEvents> {
    isReady: boolean;
    userId: Snowflake;
    readonly nodes: Collection<string, nSysNode>;
    readonly players: Collection<string, nSysPlayer>;
    constructor(config: IManagerConfig);
    usePlugin(plugin: nSysLavaPlugin);
    handleVoiceUpdate(payload: IVoiceUpdate);
    connect(userId: Snowflake): void;
    createPlayer(guildId: Snowflake): nSysPlayer | undefined;
    getPlayer(guildId: Snowflake): nSysPlayer | undefined;
    async loadTracks(search: string): Promise<ILavalinkLoadtracks>;
}

export class nSysPlayer extends TypedEmitter<IPlayerEvents> {
    readonly manager: nSysManager;
    node: nSysNode | null;
    readonly guildId: Snowflake;
    channelId: Snowflake | null;
    readonly queue: nSysQueue;
    isDeafened: boolean;
    isMuted: boolean;
    position: number;
    isPlaying: boolean;
    isPaused: boolean;
    constructor(config: IPlayerConfig)
    handleVoiceUpdate(payload: IVoiceUpdate): void
    connect(channelId: Snowflake | null, options?: IPlayerConnectOptions): this
    async disconnect(): Promise<this>
    async play(track: string | { track: string }, startTime: number): Promise<this>;
    async stop(): Promise<this>;
    async setPause(pause: boolean): Promise<this>;
    async seek(position: number): Promise<this>;
    async destroy(): Promise<this>;
    async setVolume(volume: number): Promise<this>;
    reconnectNode(node: nSysNode): void;
}

export class nSysQueue {
    readonly player: nSysPlayer;;
    tracks: {
        previous: ILavalinkTrack[]
        current: ILavalinkTrack | null;
        next: ILavalinkTrack[]
    };
    loopType: LoopModeType;
    isAutoplay: boolean;
    constructor(player: nSysPlayer);
    add(tracks: ILavalinkTrack | ILavalinkTrack[], requester: Snowflake): boolean;
    remove(index: number): boolean;
    async start(): Promise<boolean>;
    async skip(): Promise<void>;
    async previous(): Promise<boolean>;
    skipTo(index: number);
    clear(): boolean;
    shuffle(): boolean;
    setLoop(type: LoopModeType): boolean;
    setAutoplay(bool: boolean): boolean;
}

export class nSysLavaPlugin {
    load(manager: nSysManager): void;
    unload(manager: nSysManager): void;
}