import { lavalinkTrack, payloadData } from "../Node/interface"

export interface VoiceUpdate {
    token?: string
    endpoint?: string
    guild_id: string
    session_id?: string
    channel_id?: string
    user_id?: string
}

export interface connectOptions {
    deafened?: boolean
    muted?: boolean
}

export interface playerEvents {
    sendGatewayPayload: (guildId: string, payload: payloadData) => void
    TrackStart: (track: lavalinkTrack) => void
    TrackEnd: (track: lavalinkTrack) => void
    TrackException: (track: lavalinkTrack) => void
    TrackStuckEvent: (track: lavalinkTrack) => void
    queueEnd: () => void
}