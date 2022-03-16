export interface ConnectionConfig {
    host: string
    port: number
    secure?: boolean,
    authorization: string
    clientName?: string
    reconnect?: {
        retryAmout: number
        delay: number
    }
}

export interface NodeConfig {
    name?: string
    host: string
    port: number
    secure?: boolean
    authorization: string
    clientName?: string
    reconnect?: {
        retryAmout: number
        delay: number
    }
    search?: boolean
    play?: boolean
}

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

export interface lavalinkLoadtracks {
    loadType: loadType;
    playlistInfo: playlistInfo
    tracks: lavalinkTrack[]
}
type loadType = 'TRACK_LOADED' | 'PLAYLIST_LOADED' | 'SEARCH_RESULT' | 'NO_MATCHES' | 'LOAD_FAILED'
interface playlistInfo {
    name?: string
    selectedTrack?: number
}
export interface lavalinkTrack {
    track: string
    info: {
        identifier: string
        isSeekable: boolean
        author: string
        length: number
        isStream: boolean
        position: number
        title: string
        uri: string
        sourceName: string
    }
}

export interface lavalinkStats {
    cpu: {
        cores: number,
        lavalinkLoad: number,
        systemLoad: number
    },
    frameStats: {
        deficit: number,
        nulled: number,
        sent: number
    },
    memory: {
        allocated: number,
        free: number,
        reservable: number,
        used: number
    },
    players: number,
    playingPlayers: number,
    uptime: number
};

export interface payloadData {
    op: number
    d: {
        guild_id: string
        channel_id: string | null
        self_mute: boolean
        self_deaf: boolean
    }
}