import Config from "./Config";
import {AdvancedDynamicTexture, Button, Image, Rectangle, XmlLoader} from "babylonjs-gui";
import GameMgr from "./GameMgr";
import PlayerData from "./PlayerData";
import PlayerInfoPanel from "./PlayerInfoPanel";

declare const addPercent;

export default class GUI {
    private xmlLoader: XmlLoader;
    private loaded: boolean;
    private clockEndTime: number;
    private points: number[];
    private selfPlayerInfoPanel: PlayerInfoPanel;
    private playerInfoPanelList: PlayerInfoPanel[] = [];
    private otherPlayerInfoPanelList: PlayerInfoPanel[] = [];

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
            GameMgr.playerDataList.forEach(info => this.updatePlayerInfo(info));
        }
    }

    public onEnterRoom(data) {
        this.updatePlayerInfo(GameMgr.getPlayerDataByUid(data.uid));
    }

    public removePlayer(index: number) {
        const playerInfo = this.xmlLoader.getNodeById(`playerInfo${index}`) as Rectangle;
        playerInfo.isVisible = false;
    }

    public onReadyForBamao(data) {
        this.updatePlayerInfo(GameMgr.getPlayerDataByUid(data.uid));
    }

    public onStartReadyForBamao(data) {
        this.xmlLoader.getNodeById("preparationRect").isVisible = true;
        this.startClock(data.readyEndTime, "waitForStart");
    }

    public onStartForBamao() {
        GameMgr.playerDataList.forEach(info => this.updatePlayerInfo(info));
    }

    public onSelfReady() {
        this.xmlLoader.getNodeById("preparationRect").isVisible = false;
        this.updatePlayerInfo(GameMgr.selfPlayerData);
    }

    public onSendDiceForBamao() {
        GameMgr.playerDataList.forEach(info => this.updatePlayerInfo(info));
        this.xmlLoader.getNodeById("callResultRect").isVisible = false;
        this.xmlLoader.getNodeById("pointsRect").isVisible = false;
    }

    public onEliminateStartForBamao(data) {
        if (data.opeUid === GameMgr.selfPlayerData.uid) {
            this.points = [];
            this.xmlLoader.getNodeById("pointsRect").isVisible = true;
            this.xmlLoader.getNodeById("numberPointsRect").isVisible = true;
            for (let i = 1; i <= 6; i++) {
                (this.xmlLoader.getNodeById(`point${i}`) as Button).getChildByName("selected").isVisible = false;
            }
            this.xmlLoader.getNodeById("DSPointsRect").isVisible = false;
            this.xmlLoader.getNodeById("DXPointsRect").isVisible = false;
            this.startClock(data.endTime, "waitForCall");
        } else {
            this.startClock(data.endTime, "waitForOtherCall");
        }
        this.selfPlayerInfoPanel.refresh(GameMgr.selfPlayerData);
    }

    public onEliminateOpeForBamao(data) {
        this.xmlLoader.getNodeById("pointsRect").isVisible = false;
        this.startClock(data.endTime, "showResult");
        const callResultRect = this.xmlLoader.getNodeById("callResultRect") as Rectangle;
        callResultRect.isVisible = true;
        if (GameMgr.eliminateOpePlayerIndex !== undefined) {
            const playerInfoPanel = this.xmlLoader.getNodeById(`playerInfo${GameMgr.eliminateOpePlayerIndex}`) as Rectangle;
            callResultRect.left = playerInfoPanel.left;
            callResultRect.top = playerInfoPanel.top;
            const callResultDiceRect = this.xmlLoader.getNodeById("callResultDiceRect") as Rectangle;
            callResultDiceRect.children.forEach((child: Image, i: number) => {
                const point = data.removeDice[i];
                if (point !== undefined) {
                    child.isVisible = true;
                    child.source = Config.pointImagePath.replace("${point}", point);
                } else {
                    child.isVisible = false;
                }
            });
        }
        GameMgr.playerDataList.forEach((info, i) => {
            this.playerInfoPanelList[i].refresh(info);
        });
    }

    public onGameOverForBamao() {
        // 自己没骰子了就可以撤了
        // 可是这样子好像好没结算
    }

    private onLoaded() {
        setInterval(this.onClock.bind(this), 1000);
        for (let i = 0; i < Config.cups.length; i++) {
            const playerInfo = this.xmlLoader.getNodeById(`playerInfo${i}`) as Rectangle;
            const playerInfoPanel = new PlayerInfoPanel(playerInfo);
            this.playerInfoPanelList.push(playerInfoPanel);
            playerInfoPanel.isVisible = false;
            if (i === 0) {
                this.selfPlayerInfoPanel = playerInfoPanel;
            } else {
                this.otherPlayerInfoPanelList[i] = playerInfoPanel;
            }
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
        addPercent(0.2);
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

    private updatePlayerInfo(info: PlayerData) {
        const index = GameMgr.getPlayerIndexBySeat(info.seatNum);
        this.playerInfoPanelList[index].isVisible = true;
        this.playerInfoPanelList[index].refresh(info);
    }

    private startClock(endTime: number, waitForText: string) {
        const waitForRect = this.xmlLoader.getNodeById("waitForRect") as Rectangle;
        if (waitForText) {
            waitForRect.isVisible = true;
            waitForRect.children.forEach(child => child.isVisible = child.name === waitForText);
        } else {
            waitForRect.isVisible = false;
        }
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


