import { nSysManager } from "../Manager";
import { lavalinkLoadtracks, lavalinkTrack } from "../Node/interface";
import { nSysPlayer } from "../Player";

import { loopMode } from './interface'

export class nSysQueue {
    public player: nSysPlayer;
    public previous: lavalinkTrack[] = [];
    public current: lavalinkTrack | null = null;
    public tracks: lavalinkTrack[] = [];
    public loop: loopMode = loopMode.NONE;
    public isAutoplay: boolean = false;

    private isPrevious: boolean = false;

    constructor(player: nSysPlayer) {
        this.player = player;
    }

    add(tracks: lavalinkTrack | lavalinkTrack[], requester?: string): boolean {
        if (!Array.isArray(tracks)) tracks = [ tracks ];
        if (!tracks.length) return false;
        if (requester) tracks = tracks.map(info => ({ ...info, requester }));
        this.tracks.push(...tracks);
        return true;
    }

    remove(index: number): boolean {
        const track = this.tracks[index - 1];
        console.log('index', index)
        if (!track) return false;
        this.tracks = this.tracks.filter(_ => _ !== track);
        return true;
    }

    async next(): Promise<boolean> {
        let track = this.tracks.shift();
        switch (this.loop) {
            case loopMode.NONE:
                if (!track) {
                    if (!this.isAutoplay) {
                        this.current = null;
                        this.player.emit('queueEnd');
                        return false
                    }
                    let toLoad = `https://www.youtube.com/watch?v=${this.current?.info?.identifier ?? 'G0iN4jhaKqw'}&list=RD${this.current?.info?.identifier ?? 'G0iN4jhaKqw'}&start_radio=1`
                    const search = async (toSearch: string): Promise<lavalinkLoadtracks> => {
                        if (this.player.manager) return this.player.manager.loadTracks(toSearch);
                        if (!this.player.node.search) return { loadType: 'LOAD_FAILED', playlistInfo: {}, tracks: [] };
                        return this.player.node.loadTracks(toSearch)
                    }
                    let res = await search(toLoad)
                    if (res.loadType === 'LOAD_FAILED' || res.loadType === 'NO_MATCHES') res = await search('https://www.youtube.com/watch?v=G0iN4jhaKqw');
                    this.add(res.tracks[1]);
                    if (!this.player.isPlaying && !this.player.isPaused) this.next();
                    return true;
                }
                if (this.current && !this.isPrevious) this.previous.push(this.current);
                if (this.isPrevious) this.isPrevious = false;
                this.current = track;
                await this.player.play(track.track);
                break;
            case loopMode.QUEUE:
                if (!track) {
                    this.clear();
                    this.tracks.push(...this.previous);
                    if (this.current) this.tracks.push(this.current);
                    this.previous = [];
                    track = this.tracks.shift();
                    if (!track) return false;
                }
                if (this.current && !this.isPrevious) this.previous.push(this.current);
                if (this.isPrevious) this.isPrevious = false;
                this.current = track;
                await this.player.play(track.track);
                break;
            case loopMode.TRACK:
                if (!this.current) return false;
                await this.player.play(this.current.track);
                break;
        }
        return true;
    }

    async start(): Promise<boolean> {
        return this.next();
    }

    async skip(): Promise<void> {
        await this.player.stop()
        return;
    }

    async toPrevious(): Promise<boolean> {
        let tracks = this.tracks
        this.clear();
        const track = this.previous.pop();
        if (!track) return false;
        this.tracks.push(track);
        if (this.current) this.tracks.push(this.current);
        this.tracks.push(...tracks);
        this.isPrevious = true;
        await this.player.stop();
        return true;
    }

    async skipTo(index: number): Promise<void> {
        for (let i = 0; i < index; i++) await this.next();
        return;
    }

    clear(): boolean {
        if (!this.tracks.length) return false
        this.tracks = [];
        return true;
    }

    shuffle(): boolean {
        if (!this.tracks.length) return false;
        for (let i = this.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
        }
        return true
    }

    setLoop(loop = loopMode.NONE): boolean {
        if (![...Array(3).keys()].includes(loop)) return false;
        this.loop = loop;
        return true;
    }

    setAutoplay(bool = true): void {
        this.isAutoplay = bool;
    }
}