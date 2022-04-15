import { nSysPlayer } from "./Player";

import { ILavalinkTrack } from "../interfaces/interfaces";
import { LoopModeType } from "../interfaces/enums";
import { Snowflake } from "../interfaces/types";

export class nSysQueue {
    public readonly player: nSysPlayer;
    public tracks: {
        previous: ILavalinkTrack[]
        current: ILavalinkTrack | null;
        next: ILavalinkTrack[]
    } = {
        previous: [],
        current: null,
        next: []
    }
    public loopType: LoopModeType = LoopModeType.NONE;
    public isAutoplay: boolean = false;

    private _isPreviousNow: boolean = false;

    constructor(player: nSysPlayer) {
        this.player = player;
    }
    
    add(tracks: ILavalinkTrack | ILavalinkTrack[], requester: Snowflake = ''): boolean {
        if (!Array.isArray(tracks)) tracks = [ tracks ];
        if (!tracks.length) return false;
        tracks = tracks.map(track => ({ track: track.track, info: { ...track.info, requester } }));
        this.tracks.next.push(...tracks);
        return true;
    }

    remove(index: number): boolean {
        const toDelete = this.tracks.next[index] as ILavalinkTrack | undefined;
        if (!toDelete) return false;
        this.tracks.next = this.tracks.next.filter(_ => _ !== toDelete);
        return true;
    }

    private async _next(): Promise<boolean> {
        switch (this.loopType) {
            case LoopModeType.NONE: {
                const track = this.tracks.next.shift();
                if (!track) {
                    if (this.isAutoplay) {
                        const identifier = this.tracks.current?.info?.identifier ?? 'AUP3OI9Yhmc';
                        const result = await this.player.manager.loadTracks(`https://www.youtube.com/watch?v=${identifier}&list=RD${identifier}&start_radio=1`);
                        if (!result.tracks.length) {
                            if (this.tracks.current) this.player.emit('TrackException', this.tracks.current);
                            return false;
                        }
                        this.add(result.tracks[0], this.tracks.current?.info?.requester);
                        return true;
                    }
                    this.tracks.current = null;
                    this.player.emit('queueEnd');
                    return false;
                }
                if (this.tracks.current && !this._isPreviousNow) this.tracks.previous.push(this.tracks.current);
                if (this._isPreviousNow) this._isPreviousNow = false;
                this.tracks.current = track;
                await this.player.play(track.track);
            } break;
            case LoopModeType.QUEUE: {
                let track = this.tracks.next.shift();
                if (!track) {
                    this.clear();
                    this.tracks.next.push(...this.tracks.previous);
                    if (this.tracks.current) this.tracks.next.push(this.tracks.current);
                    this.tracks.previous = [];
                    track = this.tracks.next.shift();
                    if (!track) return false;
                }
                if (this.tracks.current && !this._isPreviousNow) this.tracks.previous.push(this.tracks.current);
                if (this._isPreviousNow) this._isPreviousNow = false;
                this.tracks.current = track;
                await this.player.play(track.track);
            } break;
            case LoopModeType.TRACK: {
                if (!this.tracks.current) return false;
                await this.player.play(this.tracks.current.track);
            } break;
        }
        return true;
    }

    async start(): Promise<boolean> {
        return this._next();
    }

    async skip(): Promise<void> {
        await this.player.stop();
        return;
    }

    async previous(): Promise<boolean> {
        let tracks = this.tracks.next;
        this.clear();
        const track = this.tracks.previous.pop();
        if (!track) return false;
        this.tracks.next.push(track);
        if (this.tracks.current) this.tracks.next.push(this.tracks.current);
        this.tracks.next.push(...tracks);
        this._isPreviousNow = true;
        await this.player.stop();
        return true;
    }

    skipTo(index: number) {
        for (let i = 0; i < index; i++) {
            this._next();
        }
    }

    clear(): boolean {
        if (!this.tracks.next.length) return false;
        this.tracks.next = [];
        return true;
    }

    shuffle(): boolean {
        if (!this.tracks.next.length) return false;
        for (let i = this.tracks.next.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tracks.next[i], this.tracks.next[j]] = [this.tracks.next[j], this.tracks.next[i]];
        }
        return true
    }

    setLoop(type: LoopModeType): boolean {
        if (this.loopType === type || ![...Array(3).keys()].includes(type)) return false;
        this.loopType = type;
        return true;
    }

    setAutoplay(bool: boolean): boolean {
        if (this.isAutoplay === bool) return false;
        this.isAutoplay = bool;
        return true;
    }
}