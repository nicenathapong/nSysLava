import type { nSysNode } from '../lib/Node';
import type { Snowflake } from './types'
import type { ILavalinkTrack, IGatewayPayload } from './interfaces'

export interface IConnectionEvents {
    wsOpen: () => void;
    message: (message: any) => void;
    wsClose: () => void;
    reconnect: (retryAmout: number) => void;
    offline: () => void
}

export interface INodeEvents {
    connected: () => void;
    disconnected: () => void;
    reconnecting: (retryAmout: number) => void;
    offline: () => void;
}

export interface IManagerEvents {
    ready: () => void;
    sendGatewayPayload: (id: Snowflake, payload: IGatewayPayload) => void;
    nodeConnect: (node: nSysNode) => void;
    nodeDisconnect: (node: nSysNode) => void;
    nodeReconnect: (node: nSysNode, retryAmout: number) => void;
    nodeOffline: (node: nSysNode) => void;
}

export interface IPlayerEvents {
    TrackStart: (track: ILavalinkTrack) => void;
    TrackEnd: (track: ILavalinkTrack) => void;
    TrackException: (track: ILavalinkTrack) => void;
    TrackStuckEvent: (track: ILavalinkTrack) => void;
    queueEnd: () => void;
    channelJoin: () => void;
    channelLeave: () => void;
    channelMove: () => void
}