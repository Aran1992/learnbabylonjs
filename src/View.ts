import {CannonJSPlugin, Engine, FreeCamera, HemisphericLight, Scene, SceneLoader, Vector3} from "babylonjs";
import {AdvancedDynamicTexture, Button, Image, Rectangle, TextBlock, XmlLoader} from "babylonjs-gui";
import "babylonjs-loaders";
import Config from "./Config";
import Util from "./Util";
import DataMgr from "./DataMgr";
import SoundMgr from "./SoundMgr";
import {EStage} from "./EStage";
import PlayerInfoPanel from "./PlayerInfoPanel";
import SettingPanel from "./SettingPanel";
import EventMgr from "./EventMgr";
import {Event} from "./Event";
import ChoosePointPanel from "./ChoosePointPanel";
import CallResultPanel from "./CallResultPanel";
import Cup from "./Cup";

export default class View {
    private dataMgr: DataMgr;

    private meshTable = {};

    private scene: Scene;

    private foreground: AdvancedDynamicTexture;
    private xmlLoader: XmlLoader;

    private playerInfoPanelList: PlayerInfoPanel[] = [];
    private selfPlayerInfoPanel: PlayerInfoPanel;

    private cupList: Cup[] = [];

    private returnBtn: Button;
    private helpBtn: Button;
    private helpPanel: Rectangle;
    private closeHelpBtn: Button;
    private settingBtn: Button;
    private settingPanel: SettingPanel;

    private readyRect: Rectangle;
    private readyBtn: Button;
    private changeBtn: Button;
    private changeBtnInCenter: Button;

    private startRect: Rectangle;

    private rollRect: Rectangle;
    private rollRemainTimeRect: Rectangle;
    private rollRemainTimeText: TextBlock;
    private rollBtn: Button;
    private rollRemainTimeFrameID: number;
    private rollTimers: { clearTimeout: CallableFunction }[] = [];
    private allPlayerRolledTimer: { clearTimeout: CallableFunction };

    private yourTurnRect: Rectangle;
    private yourTurnAnimationTimer: { clearTimeout: CallableFunction };
    private waitForOtherCall: Image;
    private choosePointPanel: ChoosePointPanel;

    private callResultPanel: CallResultPanel;
    private showEndedTimer: { clearTimeout: CallableFunction };

    private winRect: Rectangle;
    private loseRect: Rectangle;
    private drawRect: Rectangle;

    private leaveRect: Rectangle;

    private modelsLoaded: boolean = false;
    private layoutLoaded: boolean = false;
    private audioLoaded: boolean = false;
    private hasClickedDocument: boolean = false;

    constructor(dataMgr: DataMgr) {
        this.dataMgr = dataMgr;
    }

    public init() {
        this.registerEvent();
        this.createScene();
        this.loadModels();
        this.createUI();
        this.loadAudios();
    }

    private registerEvent() {
        EventMgr.register(Event.PlayerEnterRoom, this.onPlayerEnterRoom);
        EventMgr.register(Event.PlayerLeaveRoom, this.onPlayerLeaveRoom);
        EventMgr.register(Event.PlayerReady, this.onPlayerReady);
        EventMgr.register(Event.StageChange, this.onStageChange);
    }

    private createScene() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;

        const engine = new Engine(canvas);

        const scene = new Scene(engine);
        this.scene = scene;

        const cannonJSPlugin = new CannonJSPlugin(false);
        scene.enablePhysics(null, cannonJSPlugin);

        const [x, y, z] = Config.camera.pos;
        const camera = new FreeCamera("", new Vector3(x, y, z), scene);
        const [tx, ty, tz] = Config.camera.target;
        camera.setTarget(new Vector3(tx, ty, tz));
        // 不知道为啥默认旋转角度不是0 需要转回来
        camera.rotation.y = 0;
        // camera.attachControl(canvas);

        new HemisphericLight("", new Vector3(1, 1, -1), scene);

        engine.runRenderLoop(() => {
            scene.render();
        });
    }

    private loadModels() {
        Config.meshNameList.forEach(name => {
            SceneLoader.ImportMesh("",
                `./assets/model/${name}/`,
                `${name}.gltf`,
                undefined,
                ([mesh]) => {
                    mesh.setEnabled(false);
                    this.meshTable[name] = mesh;
                    let count = 0;
                    for (const key in this.meshTable) {
                        if (this.meshTable.hasOwnProperty(key)) {
                            count++;
                        }
                    }
                    if (count === Config.meshNameList.length) {
                        this.onModelsLoaded();
                    }
                }
            );
        });
    }

    private onModelsLoaded() {
        Config.cups.forEach(([x, z], i) => {
            let cupMeshName = i === this.dataMgr.selfPlayerIndex ? "shaizhong" : "shaizhong2";
            const cup = new Cup(this.scene, new Vector3(x, 0, z), this.meshTable["touzi"], this.meshTable[cupMeshName]);
            this.cupList.push(cup);
        });
        window["cup"] = this.cupList[0];
        this.modelsLoaded = true;
        this.onModelsAndLayoutLoaded();
    }

    private createUI() {
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
        this.xmlLoader.loadLayout(Config.uiXMLPath, foreground, this.onLayoutLoaded);
        this.foreground = foreground;
    }

    private onLayoutLoaded = () => {
        // todo 设计问题：等待别的数据到达前，是否需要展示什么
        // this.foreground.rootContainer.isVisible = false;

        const allPlayerInfoPanel = this.xmlLoader.getNodeById("allPlayerInfoPanel") as Rectangle;
        allPlayerInfoPanel.children.forEach((child: Rectangle, i) => {
            if (i === 0) {
                this.selfPlayerInfoPanel = new PlayerInfoPanel(i, child, Config.myPlayerInfoPanel);
                this.playerInfoPanelList.push(this.selfPlayerInfoPanel);
            } else {
                this.playerInfoPanelList.push(new PlayerInfoPanel(i, child, Config.otherPlayerInfoPanel));
            }
        });

        this.returnBtn = this.xmlLoader.getNodeById("returnBtn");
        Util.onClick(this.returnBtn, this.onClickReturnBtn);

        this.helpBtn = this.xmlLoader.getNodeById("helpBtn");
        Util.onClick(this.helpBtn, this.onClickHelpBtn);
        this.helpPanel = this.xmlLoader.getNodeById("helpPanel");
        this.closeHelpBtn = this.xmlLoader.getNodeById("closeHelpBtn");
        Util.onClick(this.closeHelpBtn, this.closeHelpBtnClick);

        this.settingBtn = this.xmlLoader.getNodeById("settingBtn");
        Util.onClick(this.settingBtn, this.onClickSettingBtn);
        this.settingPanel = new SettingPanel(this.xmlLoader);
        this.settingPanel.isVisible = false;

        this.readyRect = this.xmlLoader.getNodeById("readyRect");
        this.readyBtn = this.xmlLoader.getNodeById("readyBtn");
        Util.onClick(this.readyBtn, this.onClickReadyBtn);
        this.changeBtn = this.xmlLoader.getNodeById("changeBtn");
        Util.onClick(this.changeBtn, this.onClickChangeBtn);
        this.changeBtnInCenter = this.xmlLoader.getNodeById("changeBtnInCenter");
        Util.onClick(this.changeBtn, this.onClickChangeBtn);

        this.startRect = this.xmlLoader.getNodeById("startRect");

        this.rollRect = this.xmlLoader.getNodeById("rollRect");
        this.rollRemainTimeRect = this.xmlLoader.getNodeById("rollRemainTimeRect");
        this.rollRemainTimeText = this.xmlLoader.getNodeById("rollRemainTimeText");
        this.rollBtn = this.xmlLoader.getNodeById("rollBtn");
        Util.onClick(this.rollBtn, this.onClickRollBtn);

        this.yourTurnRect = this.xmlLoader.getNodeById("yourTurnRect");
        this.waitForOtherCall = this.xmlLoader.getNodeById("waitForOtherCall");
        this.choosePointPanel = new ChoosePointPanel(this.dataMgr, this.xmlLoader);

        this.callResultPanel = new CallResultPanel(this.xmlLoader);

        this.winRect = this.xmlLoader.getNodeById("winRect");
        this.loseRect = this.xmlLoader.getNodeById("loseRect");
        this.drawRect = this.xmlLoader.getNodeById("drawRect");

        this.leaveRect = this.xmlLoader.getNodeById("leaveRect");

        this.resetViewToBasicStage();

        this.layoutLoaded = true;
        this.onModelsAndLayoutLoaded();
    }

    private onModelsAndLayoutLoaded() {
        if (this.modelsLoaded && this.layoutLoaded) {
            this.dataMgr.onInitDataReceived = this.recoverViewToCurStage;
        }
    }

    private onPlayerEnterRoom = (playerIndex) => {
        const panel = this.playerInfoPanelList[playerIndex];
        panel.show(this.dataMgr, this.dataMgr.playerInfoList[playerIndex]);
    }

    private onPlayerLeaveRoom = (playerIndex) => {
        const panel = this.playerInfoPanelList[playerIndex];
        panel.hide();
        this.leaveRect.isVisible = true;
    }

    private resetViewToBasicStage() {
        this.readyRect.isVisible = false;
        this.startRect.isVisible = false;
        this.rollRect.isVisible = false;
        this.yourTurnRect.isVisible = false;
        this.waitForOtherCall.isVisible = false;
        this.choosePointPanel.hide();
        this.callResultPanel.hide();
        this.winRect.isVisible = false;
        this.loseRect.isVisible = false;
        this.drawRect.isVisible = false;
        this.leaveRect.isVisible = false;
    }

    private onStageChange = (newStage: EStage, oldStage: EStage) => {
        this.refreshPlayerInfoPanels();
        if (oldStage !== undefined) {
            this.stageHandler[oldStage].clear();
        }
        this.stageHandler[newStage].enter();
    }

    private recoverViewToCurStage = () => {
        this.refreshPlayerInfoPanels();
        this.stageHandler[this.dataMgr.curStage].recover();
    }

    private refreshPlayerInfoPanels() {
        this.playerInfoPanelList.forEach((panel, i) => {
            const info = this.dataMgr.playerInfoList[i];
            if (info) {
                panel.show(this.dataMgr, info);
            } else {
                panel.hide();
            }
        });
    }

    private recoverToReady = () => {
        this.readyRect.isVisible = !this.dataMgr.selfPlayerInfo.ready;
        this.changeBtnInCenter.isVisible = false;
        this.cupList.forEach((cup, i) => {
            const info = this.dataMgr.playerInfoList[i];
            if (info && info.ready) {
                cup.show();
            } else {
                cup.hide();
            }
        });
    }

    private onPlayerReady = (playerIndex) => {
        const panel = this.playerInfoPanelList[playerIndex];
        panel.show(this.dataMgr, this.dataMgr.playerInfoList[playerIndex]);
        if (playerIndex === this.dataMgr.selfPlayerIndex) {
            this.readyRect.isVisible = false;
        }
        this.cupList[playerIndex].show();
    }

    private onClickReadyBtn = () => {
        this.dataMgr.ready();
    }

    private onClickChangeBtn = () => {
        this.dataMgr.change();
    }

    private clearReady = () => {
        this.readyRect.isVisible = false;
    }

    private recoverToStart = () => {
        this.startRect.isVisible = true;
    }

    private clearStart = () => {
        this.startRect.isVisible = false;
    }

    private recoverToRoll = () => {
        if (this.dataMgr.selfPlayerInfo.ready) {
            this.rollRect.isVisible = true;
            this.rollBtn.isVisible = !this.dataMgr.selfPlayerInfo.rolled;
        } else {
            this.rollRect.isVisible = false;
        }
        this.playRollRemainTimeFrame();
        this.showPlayerRollResult();
        this.dataMgr.playerInfoList.forEach((info, i) => {
            if (info.ready && !info.rolled && i !== this.dataMgr.selfPlayerIndex) {
                const time = (info.rollEndedTime - new Date().getTime()) * Math.random();
                this.rollTimers[i] = Util.setTimeout(() => this.playerRoll(i), time);
            }
        });
    }

    private playRollRemainTimeFrame = () => {
        const remainTime = this.dataMgr.rollEndedTime - new Date().getTime();
        if (remainTime > 0) {
            this.rollRemainTimeRect.isVisible = true;
            this.rollRemainTimeText.text = Math.ceil(remainTime / 1000).toString();
            this.rollRemainTimeFrameID = requestAnimationFrame(this.playRollRemainTimeFrame);
        } else {
            this.rollRemainTimeRect.isVisible = false;
            this.onRollFinalTime();
        }
    }

    private onClickRollBtn = () => {
        this.playerRoll(this.dataMgr.selfPlayerIndex);
        this.rollBtn.isVisible = false;
        SoundMgr.playSound(Config.audioResTable.shake);
    }

    private playerRoll = (playerIndex) => {
        const info = this.dataMgr.playerInfoList[playerIndex];
        info.rolled = true;
        const panel = this.playerInfoPanelList[playerIndex];
        panel.show(this.dataMgr, info);
        this.cupList[playerIndex].roll(playerIndex === this.dataMgr.selfPlayerIndex ? this.dataMgr.selfPlayerInfo.dices : []);
    }

    private onRollFinalTime = () => {
        if (this.dataMgr.selfPlayerInfo.ready && !this.dataMgr.selfPlayerInfo.rolled) {
            this.onClickRollBtn();
        }
        this.dataMgr.playerInfoList.forEach((info, i) => {
            if (info.ready && !info.rolled) {
                this.playerRoll(i);
            }
        });
        this.allPlayerRolledTimer = Util.setTimeout(this.onAllPlayerRolled, Config.rollAnimationDuration);
    }

    private onAllPlayerRolled = () => {
        this.dataMgr.curStage = EStage.Call;
        EventMgr.notify(Event.StageChange, EStage.Call, EStage.Roll);
    }

    private showPlayerRollResult = () => {
        this.cupList.forEach((cup, i) => {
            const info = this.dataMgr.playerInfoList[i];
            if (info && info.ready) {
                if (info.rolled && i === this.dataMgr.selfPlayerIndex) {
                    cup.showPoints(info.dices);
                } else {
                    cup.showCount(info.diceCount);
                }
            } else {
                cup.hide();
            }
        });
    }

    private clearRoll = () => {
        this.rollRect.isVisible = false;
        if (this.rollRemainTimeFrameID !== undefined) {
            cancelAnimationFrame(this.rollRemainTimeFrameID);
            delete this.rollRemainTimeFrameID;
        }
        this.rollTimers.forEach(timer => timer.clearTimeout());
        this.rollTimers = [];
        if (this.allPlayerRolledTimer) {
            this.allPlayerRolledTimer.clearTimeout();
            delete this.allPlayerRolledTimer;
        }
        this.showPlayerRollResult();
    }

    private recoverToCall = () => {
        this.yourTurnRect.isVisible = false;
        if (this.dataMgr.callPlayerIndex === this.dataMgr.selfPlayerIndex) {
            this.waitForOtherCall.isVisible = false;
            if (!this.dataMgr.selfPlayerInfo.called
                && new Date().getTime() < this.dataMgr.selfPlayerInfo.calledEndedTime) {
                this.choosePointPanel.show();
            } else {
                this.choosePointPanel.hide();
            }
        } else {
            this.waitForOtherCall.isVisible = true;
            this.choosePointPanel.hide();
        }
    }

    private enterCall = () => {
        if (this.dataMgr.callPlayerIndex === this.dataMgr.selfPlayerIndex) {
            this.yourTurnRect.isVisible = true;
            this.yourTurnAnimationTimer = Util.setTimeout(this.onYourTurnAnimationEnded, 1000);
            this.waitForOtherCall.isVisible = false;
        } else {
            this.waitForOtherCall.isVisible = true;
        }
    }

    private onYourTurnAnimationEnded = () => {
        this.yourTurnRect.isVisible = false;
        this.choosePointPanel.show();
    }

    private clearCall = () => {
        this.yourTurnRect.isVisible = false;
        this.waitForOtherCall.isVisible = false;
        this.choosePointPanel.hide();
        if (this.yourTurnAnimationTimer !== undefined) {
            this.yourTurnAnimationTimer.clearTimeout();
        }
    }

    private recoverToShow = () => {
        // this.callResultPanel.show(this.dataMgr.callPlayerIndex, this.dataMgr.callPoints);
        this.cupList.forEach((cup, i) => {
            const info = this.dataMgr.playerInfoList[i];
            if (info && info.ready) {
                cup.showResult(info.dices);
            } else {
                cup.hide();
            }
        });
        this.showResult();
    }

    private enterShow = () => {
        this.callResultPanel.show(this.dataMgr.callPlayerIndex, this.dataMgr.callPoints);
        this.cupList.forEach((cup, i) => {
            const info = this.dataMgr.playerInfoList[i];
            if (info && info.ready) {
                cup.eliminate(info.befDices, this.dataMgr.callPoints);
            }
        });
        this.showEndedTimer = Util.setTimeout(this.showResult, Config.eliminateDuration);
    }

    private showResult = () => {
        if (!this.dataMgr.playerInfoList.some(info => info.diceCount !== 0)) {
            this.playDraw();
        } else if (this.dataMgr.selfPlayerInfo.diceCount === 0) {
            this.playLose();
        } else if (!this.dataMgr.playerInfoList
            .filter((info, i) => i !== this.dataMgr.selfPlayerIndex)
            .some(info => info.diceCount !== 0)) {
            this.playWin();
        } else if (this.dataMgr.gameRound >= Config.maxRound) {
            this.playDraw();
        }
    }

    private playDraw() {
        this.drawRect.isVisible = true;
    }

    private playLose() {
        this.loseRect.isVisible = true;
        SoundMgr.playSound(Config.audioResTable.lose);
    }

    private playWin() {
        this.winRect.isVisible = true;
        SoundMgr.playSound(Config.audioResTable.win);
    }

    private clearShow = () => {
        this.callResultPanel.hide();
        this.drawRect.isVisible = false;
        this.loseRect.isVisible = false;
        this.winRect.isVisible = false;
        if (this.showEndedTimer) {
            this.showEndedTimer.clearTimeout();
            delete this.showEndedTimer;
        }
    }

    private stageHandler = {
        [EStage.Ready]: {
            recover: this.recoverToReady,
            enter: this.recoverToReady,
            clear: this.clearReady,
        },
        [EStage.Start]: {
            recover: this.recoverToStart,
            enter: this.recoverToStart,
            clear: this.clearStart,
        },
        [EStage.Roll]: {
            recover: this.recoverToRoll,
            enter: this.recoverToRoll,
            clear: this.clearRoll,
        },
        [EStage.Call]: {
            recover: this.recoverToCall,
            enter: this.enterCall,
            clear: this.clearCall,
        },
        [EStage.Show]: {
            recover: this.recoverToShow,
            enter: this.enterShow,
            clear: this.clearShow,
        }
    };

    private loadAudios() {
        document.addEventListener("click", this.onClickDocument, {passive: true});
        SoundMgr.loadAudioRes(Util.values(Config.audioResTable), this.onLoadedAudios);
    }

    private onClickDocument = () => {
        document.removeEventListener("click", this.onClickDocument);
        this.hasClickedDocument = true;
        this.playMusic();
    }

    private onLoadedAudios = () => {
        this.audioLoaded = true;
        this.playMusic();
    }

    private playMusic() {
        if (this.hasClickedDocument && this.audioLoaded) {
            SoundMgr.playMusic(Config.audioResTable.bgm);
        }
    }

    private onClickReturnBtn = () => {
    }

    private onClickHelpBtn = () => {
        this.helpPanel.isVisible = true;
    }

    private closeHelpBtnClick = () => {
        this.helpPanel.isVisible = false;
    }

    private onClickSettingBtn = () => {
        this.settingPanel.isVisible = true;
    }
}
