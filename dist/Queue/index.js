"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.nSysQueue = void 0;
const interface_1 = require("./interface");
class nSysQueue {
    constructor(player) {
        this.player = player;
        this.previous = [];
        this.current = null;
        this.tracks = [];
        this.loop = interface_1.loopMode.NONE;
        this.isAutoplay = false;
        this.isPrevious = false;
    }
    add(tracks, requester) {
        if (!Array.isArray(tracks))
            tracks = [tracks];
        if (!tracks.length)
            return false;
        if (requester)
            tracks = tracks.map(info => (Object.assign(Object.assign({}, info), { requester })));
        this.tracks.push(...tracks);
        return true;
    }
    remove(index) {
        const track = this.tracks[index - 1];
        console.log('index', index);
        if (!track)
            return false;
        this.tracks = this.tracks.filter(_ => _ !== track);
        return true;
    }
    next() {
        var _a, _b, _c, _d, _e, _f;
        return __awaiter(this, void 0, void 0, function* () {
            let track = this.tracks.shift();
            switch (this.loop) {
                case interface_1.loopMode.NONE:
                    if (!track) {
                        if (!this.isAutoplay) {
                            this.current = null;
                            this.player.emit('queueEnd');
                            return false;
                        }
                        let toLoad = `https://www.youtube.com/watch?v=${(_c = (_b = (_a = this.current) === null || _a === void 0 ? void 0 : _a.info) === null || _b === void 0 ? void 0 : _b.identifier) !== null && _c !== void 0 ? _c : 'G0iN4jhaKqw'}&list=RD${(_f = (_e = (_d = this.current) === null || _d === void 0 ? void 0 : _d.info) === null || _e === void 0 ? void 0 : _e.identifier) !== null && _f !== void 0 ? _f : 'G0iN4jhaKqw'}&start_radio=1`;
                        const search = (toSearch) => __awaiter(this, void 0, void 0, function* () {
                            if (this.player.manager)
                                return this.player.manager.loadTracks(toSearch);
                            if (!this.player.node.search)
                                return { loadType: 'LOAD_FAILED', playlistInfo: {}, tracks: [] };
                            return this.player.node.loadTracks(toSearch);
                        });
                        let res = yield search(toLoad);
                        if (res.loadType === 'LOAD_FAILED' || res.loadType === 'NO_MATCHES')
                            res = yield search('https://www.youtube.com/watch?v=G0iN4jhaKqw');
                        this.add(res.tracks[1]);
                        if (!this.player.isPlaying && !this.player.isPaused)
                            this.next();
                        return true;
                    }
                    if (this.current && !this.isPrevious)
                        this.previous.push(this.current);
                    if (this.isPrevious)
                        this.isPrevious = false;
                    this.current = track;
                    yield this.player.play(track.track);
                    break;
                case interface_1.loopMode.QUEUE:
                    if (!track) {
                        this.clear();
                        this.tracks.push(...this.previous);
                        if (this.current)
                            this.tracks.push(this.current);
                        this.previous = [];
                        track = this.tracks.shift();
                        if (!track)
                            return false;
                    }
                    if (this.current && !this.isPrevious)
                        this.previous.push(this.current);
                    if (this.isPrevious)
                        this.isPrevious = false;
                    this.current = track;
                    yield this.player.play(track.track);
                    break;
                case interface_1.loopMode.TRACK:
                    if (!this.current)
                        return false;
                    yield this.player.play(this.current.track);
                    break;
            }
            return true;
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.next();
        });
    }
    skip() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.player.stop();
            return;
        });
    }
    toPrevious() {
        return __awaiter(this, void 0, void 0, function* () {
            let tracks = this.tracks;
            this.clear();
            const track = this.previous.pop();
            if (!track)
                return false;
            this.tracks.push(track);
            if (this.current)
                this.tracks.push(this.current);
            this.tracks.push(...tracks);
            this.isPrevious = true;
            yield this.player.stop();
            return true;
        });
    }
    skipTo(index) {
        return __awaiter(this, void 0, void 0, function* () {
            for (let i = 0; i < index; i++)
                yield this.next();
            return;
        });
    }
    clear() {
        if (!this.tracks.length)
            return false;
        this.tracks = [];
        return true;
    }
    shuffle() {
        if (!this.tracks.length)
            return false;
        for (let i = this.tracks.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tracks[i], this.tracks[j]] = [this.tracks[j], this.tracks[i]];
        }
        return true;
    }
    setLoop(loop = interface_1.loopMode.NONE) {
        if (![...Array(3).keys()].includes(loop))
            return false;
        this.loop = loop;
        return true;
    }
    setAutoplay(bool = true) {
        this.isAutoplay = bool;
    }
}
exports.nSysQueue = nSysQueue;
