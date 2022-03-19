import { nSysNode } from "../Node"
import { nSysPlayer } from "../Player"

import { payloadData } from "../Node/interface"

export interface managerOptions {
    nodes: object[]
}

export interface lavalinkNode {
    name?: string
    host: string
    secure?: boolean
    port: number
    authorization: string
    search?: boolean
    play?: boolean
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