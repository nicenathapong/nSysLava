import { nSysManager } from '../lib/Manager';
import { nSysNode } from '../lib/Node'
import { nSysPlayer } from '../lib/Player';

import { Snowflake } from './types'

export interface IConnectionConfig {
    host: string
    port: number
    secure?: boolean
    authorization: string
    clientName?: string
    reconnect?: {
        retryAmout: number
        delay: number
    };
}

export interface INodeConfig {
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

export type IManagerConfig = INodeConfig[];

export interface IPlayerConfig {
    manager: nSysManager;
    node: nSysNode;
    guildId: Snowflake;
}

export type IQueueConfig = nSysPlayer;