import Util from "./Util";

const AudioContext = window.AudioContext || window.webkitAudioContext;

class BufferLoader {
    private context: AudioContext;
    private urlList: string[] = [];
    private onload: CallableFunction;
    private bufferList: AudioBuffer[] = [];
    private loadCount: number = 0;

    constructor(context: AudioContext, urlList: string[], callback: CallableFunction) {
        this.context = context;
        this.urlList = urlList;
        this.onload = callback;
    }

    loadBuffer(url: string, index: number) {
        let request = new XMLHttpRequest();
        request.open("GET", url, true);
        request.responseType = "arraybuffer";

        let loader = this;

        request.onload = function () {
            loader.context.decodeAudioData(
                request.response,
                function (buffer) {
                    if (!buffer) {
                        return;
                    }
                    loader.bufferList[index] = buffer;
                    if (++loader.loadCount === loader.urlList.length)
                        loader.onload(loader.bufferList);
                }
            );
        };

        request.onerror = function () {
            console.log("BufferLoader: XHR error", url);
        };

        request.send();
    }

    load() {
        if (this.urlList.length === 0) {
            return this.onload([]);
        }
        for (let i = 0; i < this.urlList.length; ++i)
            this.loadBuffer(this.urlList[i], i);
    }
}

class SoundMgr_ {
    private context: AudioContext;
    private bufferTable = {};
    private soundList: AudioBufferSourceNode[] = [];
    private musicSource: AudioBufferSourceNode;

    constructor() {
        // @ts-ignore
        this.context = new AudioContext();
        // EventMgr.register("GameStop", this.onGameStop.bind(this));
        // EventMgr.register("GameStart", this.onGameStart.bind(this));
    }

    public get isSoundOpen(): boolean {
        try {
            return JSON.parse(localStorage.isSoundOpen);
        } catch {
            return true;
        }
    }

    public get isMusicOpen(): boolean {
        try {
            return JSON.parse(localStorage.isMusicOpen);
        } catch {
            return true;
        }
    }

    public openMusic() {
        localStorage.isMusicOpen = true;
        this.muteMusic(false);
    }

    public closeMusic() {
        localStorage.isMusicOpen = false;
        this.muteMusic(true);
    }

    public openSound() {
        localStorage.isSoundOpen = true;
        this.muteSound(false);
    }

    public closeSound() {
        localStorage.isSoundOpen = false;
        this.muteSound(true);
    }

    public loadAudioRes(pathList: string[], callback: CallableFunction) {
        new BufferLoader(this.context, pathList, bufferList => {
            pathList.forEach((path, i) => {
                this.bufferTable[path] = bufferList[i];
            });
            callback();
        }).load();
    }

    public hasLoadedAudio(path: string): boolean {
        return this.bufferTable[path] !== undefined;
    }

    public playMusic(path: string, reset: boolean = false) {
        if (this.musicSource
            && this.musicSource.buffer === this.bufferTable[path]
            && !reset) {
            return;
        }
        if (this.musicSource) {
            this.musicSource.stop();
            this.musicSource.disconnect();
        }
        this.musicSource = this.context.createBufferSource();
        this.musicSource.buffer = this.bufferTable[path];
        this.musicSource.loop = true;
        if (this.isMusicOpen) {
            this.musicSource.connect(this.context.destination);
        }
        this.musicSource.start();
    }

    public pauseMusic() {
        if (this.musicSource) {
            this.musicSource.stop();
            this.musicSource.disconnect();
        }
        this.musicSource = undefined;
    }

    public playSound(path: string, callback?: CallableFunction) {
        let bs = this.context.createBufferSource();
        this.soundList.push(bs);
        bs.buffer = this.bufferTable[path];
        if (this.isSoundOpen) {
            bs.connect(this.context.destination);
        }
        bs.start();
        bs.addEventListener("ended", () => {
            Util.removeItemFromArray(this.soundList, bs);
            if (callback) {
                callback();
            }
        });
    }

    public playLoopSound(path: string) {
        let soundSource = this.context.createBufferSource();
        soundSource.buffer = this.bufferTable[path];
        soundSource.loop = true;
        if (this.isSoundOpen) {
            soundSource.connect(this.context.destination);
        }
        soundSource.start();
        return soundSource;
    }

    public stopLoopSound(soundSource: AudioBufferSourceNode) {
        soundSource.stop();
        soundSource.disconnect();
    }

    private onGameStop() {
        this.muteMusic(true);
    }

    private onGameStart() {
        if (this.isMusicOpen) {
            this.muteMusic(false);
        }
    }

    private muteMusic(muted: boolean) {
        if (!this.musicSource) {
            return;
        }
        if (muted) {
            this.musicSource.disconnect();
        } else {
            this.musicSource.connect(this.context.destination);
        }
    }

    private muteSound(muted: boolean) {
        if (muted) {
            this.soundList.forEach(bs => bs.disconnect());
        }
    }
}

const SoundMgr = new SoundMgr_();
export default SoundMgr;
