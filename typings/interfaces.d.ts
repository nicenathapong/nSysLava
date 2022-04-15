import { Snowflake, LavalinkLoadType } from "./types"

// Discord

export interface IGatewayPayload {
    op: number
    d: {
        guild_id: Snowflake
        channel_id: Snowflake | null
        self_mute: boolean
        self_deaf: boolean
    }
};

export interface IVoiceUpdate {
    token?: string
    endpoint?: string
    guild_id: string
    session_id: string
    channel_id?: string
    user_id?: string
}

export interface IPlayerVoiceState {
    event?: IVoiceUpdate;
    sessionId?: string
}

export interface IPlayerConnectOptions {
    deafened?: boolean
    muted?: boolean
}

// Lavalink

export interface ILavalinkStats {
    players: number;
    playingPlayers: number;
    uptime: number;
    memory: {
        allocated: number,
        free: number,
        reservable: number,
        used: number
    }
    cpu: {
        cores: number,
        lavalinkLoad: number,
        systemLoad: number
    }
    frameStats: {
        deficit: number,
        nulled: number,
        sent: number
    }
}

export interface ILavalinkTrack {
    track: string
    info: {
        identifier: string
        isSeekable: boolean
        author: string
        length: number
        isStream: boolean;
        position: number
        title: string
        uri: string
        sourceName: string,
        requester?: string
    }
}

export interface ILavalinkLoadtracks {
    loadType: LavalinkLoadType,
    playlistInfo: ILavalinkPlaylistInfo,
    tracks: ILavalinkTrack[]
    exception?: {
        message: string,
        severity: string
    }
}

interface ILavalinkPlaylistInfo {
    name?: string;
    selectedTrack?: number;
}