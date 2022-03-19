import { payloadData, lavalinkTrack } from './interface';

import { nSysNode, nSysPlayer } from './index'

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
    TrackStart: (player: nSysPlayer, track: lavalinkTrack) => void
    TrackEnd: (player: nSysPlayer, track: lavalinkTrack) => void
    TrackException: (player: nSysPlayer, track: lavalinkTrack) => void
    TrackStuckEvent: (player: nSysPlayer, track: lavalinkTrack) => void
    queueEnd: (player: nSysPlayer) => void
    channelLeave: (player: nSysPlayer) => void
    channelJoin: (player: nSysPlayer) => void
    channelMove: (player: nSysPlayer) => void
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
    channelLeave: () => void
    channelJoin: () => void
    channelMove: () => void
}