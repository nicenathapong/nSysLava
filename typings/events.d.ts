import { payloadData, lavalinkTrack } from './interface';

export interface ConnectionEvents {
    connected: () => void
    disconnected: () => void
    reconnecting: (retryAmout: number) => void
    reconnectingFull: () => void
    message: (message: object | any) => void
}

export interface ManagerEvents {
    sendGatewayPayload: (guildId: string, payload: payloadData) => void
    nodeConnect: (node: nSysNode) => void
    nodeDisconnect: (node: nSysNode) => void
    nodeDisconnected: (node: nSysNode) => void
    nodeReconnecting: (node: nSysNode, retryAmout: number) => void
    nodeReconnectingFull: (node: nSysNode) => void
    playerReconnect: (player: nSysPlayer) => void
}

export interface NodeEvents {
    connected: () => void
    disconnected: () => void
    reconnecting: (retryAmout: number) => void
    reconnectingFull: () => void
    sendGatewayPayload: (guildId: string, payload: payloadData) => void
    playerReconnect: (player: nSysPlayer) => void
}

export interface PlayerEvents {
    sendGatewayPayload: (guildId: string, payload: payloadData) => void
    TrackStart: (track: lavalinkTrack) => void
    TrackEnd: (track: lavalinkTrack) => void
    TrackException: (track: lavalinkTrack) => void
    TrackStuckEvent: (track: lavalinkTrack) => void
    queueEnd: () => void
}