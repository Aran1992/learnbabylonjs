import Config from "./Config";
import {AdvancedDynamicTexture, Image, Rectangle, TextBlock, XmlLoader} from "babylonjs-gui";
import GameMgr from "./GameMgr";

export default class GUI {
    private xmlLoader: XmlLoader;
    private loaded: boolean;
    private clockEndTime: number;

    constructor() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        let renderScale;
        if (canvas.width / canvas.height > Config.designWidth / Config.designHeight) {
            renderScale = Config.designHeight / canvas.height;
        } else {
            renderScale = Config.designWidth / canvas.width;
        }

        const background = AdvancedDynamicTexture.CreateFullscreenUI("", false);
        background.renderScale = renderScale;
        const image = new Image("", Config.bgImagePath);
        image.autoScale = true;
        image.stretch = Image.STRETCH_NONE;
        background.addControl(image);

        const foreground = AdvancedDynamicTexture.CreateFullscreenUI("", true);
        foreground.renderScale = renderScale;
        this.xmlLoader = new XmlLoader();
        this.xmlLoader.loadLayout(Config.uiXMLPath, foreground, this.onLoaded.bind(this));
    }

    public onGameInited() {
        if (this.loaded && GameMgr.inited) {
            this.xmlLoader.getNodeById("loadingRect").isVisible = false;
            this.updatePlayerInfo(GameMgr.selfInfo);
            for (const uid in GameMgr.otherPlayerInfo) {
                if (GameMgr.otherPlayerInfo.hasOwnProperty(uid)) {
                    const info = GameMgr.otherPlayerInfo[uid];
                    this.updatePlayerInfo(info);
                }
            }
        }
    }

    public onEnterRoom(data) {
        this.updatePlayerInfo(GameMgr.otherPlayerInfo[data.uid]);
    }

    public onReadyForBamao(data) {
        this.updatePlayerInfo(GameMgr.otherPlayerInfo[data.uid]);
    }

    public onStartReadyForBamao() {
        this.xmlLoader.getNodeById("preparationRect").isVisible = true;
        this.startClock(GameMgr.readyEndTime);
    }

    public onSelfReady() {
        this.clockEndTime = 0;
        this.xmlLoader.getNodeById("preparationRect").isVisible = false;
        this.updatePlayerInfo(GameMgr.selfInfo);
    }

    public onEliminateStartForBamao(data) {
        if (data.opeUid === GameMgr.selfInfo.uid) {
            this.xmlLoader.getNodeById("pointsRect").isVisible = true;
            this.startClock(data.endTime);
        }
    }

    private onLoaded() {
        setInterval(this.onClock.bind(this), 1000);
        for (let i = 0; i < Config.cups.length; i++) {
            const playerInfo = this.xmlLoader.getNodeById(`playerInfo${i}`) as Rectangle;
            playerInfo.isVisible = false;
        }
        this.onClick(this.xmlLoader.getNodeById("startBtn"), this.onClickStartBtn.bind(this));
        for (let i = 1; i <= 6; i++) {
            this.onClick(this.xmlLoader.getNodeById(`point${i}`), () => this.onClickPoint(i));
        }
        this.loaded = true;
        this.onGameInited();
    }

    private onClickStartBtn() {
        GameMgr.ready();
    }

    private onClickPoint(point: number) {
        GameMgr.eliminate([point]);
    }

    private onClick(button, callback) {
        button.onPointerUpObservable.add(callback);
    }

    private updatePlayerInfo(info) {
        const index = GameMgr.getPlayerIndex(info.seatNum);
        const playerInfo = this.xmlLoader.getNodeById(`playerInfo${index}`) as Rectangle;
        playerInfo.isVisible = true;
        const nameText = playerInfo.getChildByName("name") as TextBlock;
        nameText.text = info.nickname.toString();
        const moneyText = playerInfo.getChildByName("money") as TextBlock;
        moneyText.text = info.gold.toString();
        const readyText = playerInfo.getChildByName("ready") as TextBlock;
        readyText.isVisible = !!info.ready;
    }

    private startClock(endTime) {
        this.clockEndTime = endTime;
        this.onClock();
    }

    private onClock() {
        const remain = Math.floor((this.clockEndTime - new Date().getTime()) / 1000);
        if (remain >= 0) {
            this.xmlLoader.getNodeById("clockRect").isVisible = true;
            this.xmlLoader.getNodeById("clockText").text = remain.toString();
        } else {
            this.xmlLoader.getNodeById("clockRect").isVisible = false;
        }
    }
}


