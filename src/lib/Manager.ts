import { TypedEmitter } from "tiny-typed-emitter";
import Collection from '@discordjs/collection';

import { nSysNode } from "./Node";
import { nSysPlayer } from "./Player";
import { nSysLavaPlugin } from "./Plugin";

import type { IManagerEvents } from '../interfaces/events'
import type { IManagerConfig } from '../interfaces/config'
import type { IVoiceUpdate, ILavalinkLoadtracks } from "../interfaces/interfaces";
import type { Snowflake } from "../interfaces/types";

export class nSysManager extends TypedEmitter<IManagerEvents> {
    public isReady: boolean = false;
    public userId: Snowflake = "";
    public readonly nodes: Collection<string, nSysNode>;
    public readonly players: Collection<string, nSysPlayer> = new Collection();

    constructor(config: IManagerConfig) {
        super();
        this.nodes = new Collection(config.map(_ => [
            _.name ?? _.host,
            new nSysNode(_, this)
        ]));
    }

    usePlugin(plugin: nSysLavaPlugin) {
        if (plugin instanceof nSysLavaPlugin) plugin.load(this);
        else throw new RangeError(`This plugin does not extend "nSysLavaPlugin".`);
    }

    handleVoiceUpdate(payload: IVoiceUpdate) {
        const node = this.nodes.find(node => node.isConnected && node.isCanPlay);
        if (node) node.handleVoiceUpdate(payload);
    }

    connect(userId: Snowflake): void {
        this.userId = userId;
        this.nodes.forEach(node => node.connect(this.userId));
    }

    createPlayer(guildId: Snowflake): nSysPlayer | undefined {
        const node = this.nodes.find(node => node.isConnected && node.isCanPlay);
        if (!node) return undefined;
        const player = new nSysPlayer({ manager: this, node, guildId });
        node.players.set(guildId, player);
        return player;
    }

    getPlayer(guildId: Snowflake): nSysPlayer | undefined {
        const node = this.nodes.find(node => node.players.has(guildId));
        if (!node) return undefined;
        return node.players.get(guildId);
    }

    async loadTracks(search: string): Promise<ILavalinkLoadtracks> {
        const nodes = [...this.nodes.filter(node => node.isConnected && node.isCanSearch).values()];
        const node = nodes[Math.floor(Math.random()*nodes.length)];
        if (!node) return {
            loadType: 'LOAD_FAILED',
            playlistInfo: {},
            tracks: []
        }
        return node.loadTracks(search);
    }
}