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

export interface ConnectionEvents {
    connected: () => void
    disconnected: () => void
    reconnecting: (retryAmout: number) => void
    reconnectingFull: () => void
    message: (message: object | any) => void
}