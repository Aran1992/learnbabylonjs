import Config from "./Config";
import {AdvancedDynamicTexture, Button, Image, Rectangle, TextBlock, XmlLoader} from "babylonjs-gui";
import GameMgr from "./GameMgr";

export default class GUI {
    private xmlLoader: XmlLoader;
    private loaded: boolean;
    private clockEndTime: number;
    private points: number[];

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

    public onLeaveRoom(data) {
        const info = GameMgr.otherPlayerInfo[data.uid];
        if (info) {
            const index = GameMgr.getPlayerIndex(info.seatNum);
            const playerInfo = this.xmlLoader.getNodeById(`playerInfo${index}`) as Rectangle;
            playerInfo.isVisible = false;
        }
    }

    public onReadyForBamao(data) {
        this.updatePlayerInfo(GameMgr.otherPlayerInfo[data.uid]);
    }

    public onStartReadyForBamao(data) {
        this.xmlLoader.getNodeById("preparationRect").isVisible = true;
        this.startClock(data.readyEndTime, "准备阶段");
    }

    public onStartForBamao() {
        this.updatePlayerInfo(GameMgr.selfInfo);
        for (const uid in GameMgr.otherPlayerInfo) {
            if (GameMgr.otherPlayerInfo.hasOwnProperty(uid)) {
                const info = GameMgr.otherPlayerInfo[uid];
                this.updatePlayerInfo(info);
            }
        }
    }

    public onSelfReady() {
        this.xmlLoader.getNodeById("preparationRect").isVisible = false;
        this.updatePlayerInfo(GameMgr.selfInfo);
    }

    public onEliminateStartForBamao(data) {
        if (data.opeUid === GameMgr.selfInfo.uid) {
            this.points = [];
            this.xmlLoader.getNodeById("pointsRect").isVisible = true;
            // todo 根据阶段显示不同的拔毛条件
            this.xmlLoader.getNodeById("numberPointsRect").isVisible = true;
            for (let i = 1; i <= 6; i++) {
                (this.xmlLoader.getNodeById(`point${i}`) as Button).getChildByName("selected").isVisible = false;
            }
            this.xmlLoader.getNodeById("DSPointsRect").isVisible = false;
            this.xmlLoader.getNodeById("DXPointsRect").isVisible = false;
        }
        this.startClock(data.endTime, "剔除选择阶段");
    }

    public onEliminateOpeForBamao(data) {
        this.xmlLoader.getNodeById("pointsRect").isVisible = false;
        this.startClock(data.endTime, "剔除结果展示");
    }

    private onLoaded() {
        setInterval(this.onClock.bind(this), 1000);
        for (let i = 0; i < Config.cups.length; i++) {
            const playerInfo = this.xmlLoader.getNodeById(`playerInfo${i}`) as Rectangle;
            playerInfo.isVisible = false;
        }
        this.onClick(this.xmlLoader.getNodeById("startBtn"), this.onClickStartBtn.bind(this));
        for (let i = 1; i <= 6; i++) {
            this.onClick(this.xmlLoader.getNodeById(`point${i}`), () => this.onClickDoublePoint(i));
        }
        this.onClick(this.xmlLoader.getNodeById("point_single"), () => this.onClickSinglePoint([1, 3, 5]));
        this.onClick(this.xmlLoader.getNodeById("point_double"), () => this.onClickSinglePoint([2, 4, 6]));
        this.onClick(this.xmlLoader.getNodeById("point_small"), () => this.onClickSinglePoint([1, 2, 3]));
        this.onClick(this.xmlLoader.getNodeById("point_big"), () => this.onClickSinglePoint([4, 5, 6]));
        this.loaded = true;
        this.onGameInited();
    }

    private onClickStartBtn() {
        GameMgr.ready();
    }

    private onClickDoublePoint(point: number) {
        (this.xmlLoader.getNodeById(`point${point}`) as Button).getChildByName("selected").isVisible = true;
        this.points.push(point);
        if (this.points.length === 2) {
            GameMgr.eliminate(this.points);
        }
    }

    private onClickSinglePoint(points: number[]) {
        GameMgr.eliminate(points);
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

    private startClock(endTime: number, waitForText: string) {
        this.xmlLoader.getNodeById("waitForText").text = waitForText || "";
        this.clockEndTime = endTime * 1000;
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


