import GameScene from "./GameScene";
import GUI from "./GUI";
import NetworkMgr from "./NetworkMgr";
import EventMgr from "./EventMgr";

export default class GameMgr {
    private gameScene: GameScene;
    private gui: GUI;
    private networkMgr: NetworkMgr;
    private readonly eventMgr: EventMgr;

    constructor() {
        this.eventMgr = new EventMgr();
        this.networkMgr = new NetworkMgr();
        this.gameScene = new GameScene();
        this.gui = new GUI(this, this.eventMgr);
        this.networkMgr.registerStart(this.onStart.bind(this));
        this.networkMgr.requestInitData(this.onResponseInitData.bind(this));
    }

    private _inited = false;

    public get inited() {
        return this._inited;
    }

    public prepare() {
        this.networkMgr.requestPrepare(this.onResponsePrepare.bind(this));
    }

    private onResponseInitData(data) {
        this._inited = true;
        this.eventMgr.notify("gameInit");
    }

    private onResponsePrepare() {
        this.gui.onPrepared();
    }

    private onStart() {
        this.gameScene.onStart();
    }
}
