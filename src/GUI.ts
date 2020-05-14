import Config from "./Config";
import {AdvancedDynamicTexture, Button, Image, Rectangle, XmlLoader} from "babylonjs-gui";
import GameMgr from "./GameMgr";
import PlayerData from "./PlayerData";
import PlayerDataPanel from "./PlayerDataPanel";
import ChoosePointPanel from "./ChoosePointPanel";
import GameScene from "./GameScene";
import CallResultPanel from "./CallResultPanel";
import SettingPanel from "./SettingPanel";
import SoundMgr from "./SoundMgr";
import Util from "./Util";

declare const addPercent;

export default class GUI {
    private xmlLoader: XmlLoader;
    private gameScene: GameScene;
    private loaded: boolean;
    private clockEndTime: number;
    private clockCallback: CallableFunction;
    private selfPlayerInfoPanel: PlayerDataPanel;
    private playerInfoPanelList: PlayerDataPanel[] = [];
    private choosePointPanel: ChoosePointPanel;
    private callResultPanel: CallResultPanel;

    private startMusicBtn: Button;

    private returnBtn: Button;
    private helpBtn: Button;
    private helpPanel: Rectangle;
    private closeHelpBtn: Button;
    private settingBtn: Button;
    private settingPanel: SettingPanel;

    constructor(gameScene: GameScene) {
        this.gameScene = gameScene;
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

        SoundMgr.loadAudioRes(Util.values(Config.audioResTable), this.onAudioResLoaded.bind(this));
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
        if (index === 0) {
            this.xmlLoader.getNodeById("loadingRect").isVisible = true;
            this.xmlLoader.getNodeById("hasLeaveText").isVisible = true;
        }
    }

    public onReadyForBamao(data) {
        this.updatePlayerInfo(GameMgr.getPlayerDataByUid(data.uid));
    }

    public onStartReadyForBamao(data) {
        this.xmlLoader.getNodeById("preparationRect").isVisible = true;
        this.startClock(data.readyEndTime * 1000, "waitForStart");
    }

    public onStartForBamao() {
        GameMgr.startAnimation = true;
        GameMgr.playerDataList.forEach(info => this.updatePlayerInfo(info));
        this.xmlLoader.getNodeById("startTextBlock").isVisible = true;
        setTimeout(this.onStartAnimationEnded.bind(this), Config.startAnimationDuration);
    }

    public onSelfReady() {
        this.xmlLoader.getNodeById("preparationRect").isVisible = false;
        this.updatePlayerInfo(GameMgr.selfPlayerData);
    }

    public onSendDiceForBamao() {
        GameMgr.playerDataList.forEach(info => this.updatePlayerInfo(info));
        this.xmlLoader.getNodeById("callResultRect").isVisible = false;
        this.callResultPanel.hide();
    }

    public onEliminateStartForBamao() {
        this.onRollStart();
    }

    public onEliminateOpeForBamao(data) {
        this.startClock(data.endTime * 1000, "showResult");
        const callResultRect = this.xmlLoader.getNodeById("callResultRect") as Rectangle;
        callResultRect.isVisible = true;
        if (GameMgr.eliminateOpePlayerIndex !== undefined) {
            this.callResultPanel.show(GameMgr.eliminateOpePlayerIndex, data.removeDice);
        }
        GameMgr.playerDataList.forEach((info, i) => {
            this.playerInfoPanelList[i].refresh(info);
        });
    }

    public onGameOverForBamao() {
        // 自己没骰子了就可以撤了
        // 可是这样子好像好没结算
    }

    private onStartAnimationEnded() {
        GameMgr.startAnimation = false;
        this.xmlLoader.getNodeById("startTextBlock").isVisible = false;
        this.onRollStart();
    }

    private onRollStart() {
        if (!GameMgr.startAnimation && GameMgr.eliminateEndTime) {
            if (GameMgr.selfPlayerData.ready) {
                this.startClock(GameMgr.rollFinalTime, "waitForRoll", this.onClickRollRect.bind(this));
            }
            this.gameScene.otherPlayersRandomRoll();
        }
    }

    private onLoaded() {
        this.startMusicBtn = this.xmlLoader.getNodeById("startMusicBtn");
        Util.onClick(this.startMusicBtn, this.onClickStartMusicBtn.bind(this), {playSound: false});

        this.returnBtn = this.xmlLoader.getNodeById("returnBtn");
        Util.onClick(this.returnBtn, this.onClickReturnBtn.bind(this));

        this.helpBtn = this.xmlLoader.getNodeById("helpBtn");
        Util.onClick(this.helpBtn, this.onClickHelpBtn.bind(this));
        this.helpPanel = this.xmlLoader.getNodeById("helpPanel");
        this.closeHelpBtn = this.xmlLoader.getNodeById("closeHelpBtn");
        Util.onClick(this.closeHelpBtn, this.closeHelpBtnClick.bind(this));

        this.settingBtn = this.xmlLoader.getNodeById("settingBtn");
        Util.onClick(this.settingBtn, this.onClickSettingBtn.bind(this));
        this.settingPanel = new SettingPanel(this.xmlLoader);
        this.settingPanel.isVisible = false;

        setInterval(this.onClock.bind(this), 100);
        for (let i = 0; i < Config.cups.length; i++) {
            const playerInfo = this.xmlLoader.getNodeById(`playerInfo${i}`) as Rectangle;
            const playerInfoPanel = new PlayerDataPanel(playerInfo);
            this.playerInfoPanelList.push(playerInfoPanel);
            playerInfoPanel.isVisible = false;
            if (i === 0) {
                this.selfPlayerInfoPanel = playerInfoPanel;
            }
        }
        this.callResultPanel = new CallResultPanel(this.xmlLoader);
        Util.onClick(this.xmlLoader.getNodeById("prepareBtn"), this.onClickStartBtn.bind(this));
        Util.onClick(this.xmlLoader.getNodeById("rollRect"), this.onClickRollRect.bind(this), {playSound: false});
        this.loaded = true;
        addPercent(0.1);
        this.onGameInited();
    }

    private onClickStartMusicBtn() {
        SoundMgr.playMusic(Config.audioResTable.bgm);
        this.startMusicBtn.isVisible = false;
    }

    private onClickReturnBtn() {
    }

    private onClickHelpBtn() {
        this.helpPanel.isVisible = true;
    }

    private closeHelpBtnClick() {
        this.helpPanel.isVisible = false;
    }

    private onClickSettingBtn() {
        this.settingPanel.isVisible = true;
    }

    private onClickStartBtn() {
        GameMgr.ready();
    }

    private onClickRollRect() {
        this.stopClock();
        this.gameScene.selfRoll();
        SoundMgr.playSound(Config.audioResTable.shake);
    }

    private onAllPlayerRollEnded() {
        if (GameMgr.isAllPlayerRollEnded) {
            if (GameMgr.eliminateOpePlayerIndex === GameMgr.getPlayerIndexByUid(GameMgr.selfPlayerData.uid)) {
                this.startClock(GameMgr.eliminateEndTime, "waitForCall");
            } else {
                this.startClock(GameMgr.eliminateEndTime, "waitForOtherCall");
            }
        }
    }

    private updatePlayerInfo(info: PlayerData) {
        const index = GameMgr.getPlayerIndexBySeat(info.seatNum);
        this.playerInfoPanelList[index].isVisible = true;
        this.playerInfoPanelList[index].refresh(info);
    }

    private startClock(endTime: number, waitForText: string, callback?: CallableFunction) {
        const waitForRect = this.xmlLoader.getNodeById("waitForRect") as Rectangle;
        if (waitForText) {
            waitForRect.isVisible = true;
            waitForRect.children.forEach(child => child.isVisible = child.name === waitForText);
        } else {
            waitForRect.isVisible = false;
        }
        this.clockEndTime = endTime;
        this.clockCallback = callback;
        this.onClock();
    }

    private stopClock() {
        this.clockEndTime = 0;
        delete this.clockCallback;
        this.onClock();
    }

    private onClock() {
        const remain = Math.floor((this.clockEndTime - new Date().getTime()) / 1000);
        if (remain >= 0) {
            this.xmlLoader.getNodeById("clockRect").isVisible = true;
            this.xmlLoader.getNodeById("clockText").text = remain.toString();
        } else {
            this.xmlLoader.getNodeById("clockRect").isVisible = false;
            if (this.clockCallback) {
                this.clockCallback();
                delete this.clockCallback;
            }
        }
    }

    private onAudioResLoaded() {
        addPercent(0.1);
    }
}
