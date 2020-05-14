import {Rectangle} from "babylonjs-gui/2D/controls/rectangle";
import {Button} from "babylonjs-gui/2D/controls/button";
import {XmlLoader} from "babylonjs-gui/2D/xmlLoader";
import Util from "./Util";
import Config from "./Config";
import {AdvancedDynamicTexture, Image} from "babylonjs-gui";
import SoundMgr from "./SoundMgr";
import SettingPanel from "./SettingPanel";
import {CannonJSPlugin, Engine, FreeCamera, HemisphericLight, Scene, SceneLoader, Vector3} from "babylonjs";
import GameMgr from "./GameMgr";

declare const pomelo;

class PlayerData {
    public uid: number;
    public ready: boolean;

    constructor(data) {
    }
}

class DataMgr {
    public selfPlayerData: PlayerData;
    private playerDataList: PlayerData[] = [];
    private otherPlayerDataList: PlayerData[] = [];

    public init() {
        const ip = "111.229.243.99";
        // const ip = "192.168.18.80";
        fetch(`http://${ip}:28302/products/dwc_29.json`).then(initResponse => {
            initResponse.json().then(initData => {
                fetch(`http://${initData.platSvrHost}:${initData.platSvrPort}`, {
                    method: "POST",
                    headers: [["Content-Type", "application/json;charset=utf-8"]],
                    body: JSON.stringify({
                        head: {route: "http.ReqLogin", msgindex: 0, token: null},
                        body: {plat: 2, username: new Date().getTime().toString(), password: '13456'},
                    })
                }).then(loginResponse => {
                    loginResponse.json().then(loginData => {
                        console.log("loginData", loginData);
                        pomelo.init({host: initData.gameSvrHost, port: initData.gameSvrPort,}, () => {
                            this.request("gate.gateHandler.queryEntry", {}, data => {
                                pomelo.disconnect();
                                pomelo.init({
                                    host: data.host,
                                    port: data.port,
                                }, () => {
                                    this.request("connector.entryHandler.login", {token: loginData.body.token}, entryLoginData => {
                                        this.request("roomBamao.roomHandler.enterRoom", {
                                            gameId: 2,
                                            roomType: 1
                                        }, enterRoomData => {
                                            this.selfPlayerData =
                                                this.playerDataList[0] =
                                                    new PlayerData({
                                                        uid: loginData.body.uid,
                                                        nickname: entryLoginData.userData.nickname,
                                                        gold: enterRoomData.gold,
                                                        seatNum: enterRoomData.seatNum,
                                                        ready: false,
                                                    });
                                            for (const uid in enterRoomData.otherPlayerInfo) {
                                                if (enterRoomData.otherPlayerInfo.hasOwnProperty(uid)) {
                                                    const playerData = enterRoomData.otherPlayerInfo[uid];
                                                    const index = this.getPlayerIndexBySeat(playerData.seatNum);
                                                    this.otherPlayerDataList[index] =
                                                        this.playerDataList[index] =
                                                            new PlayerData(playerData);
                                                }
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    public getPlayerIndexBySeat(seatNum: number): number {
        let index = seatNum - GameMgr.selfPlayerData.seatNum;
        if (index < 0) {
            index = Config.cups.length + index;
        }
        return index;
    }

    public getPlayerIndexByUid(uid: number): number {
        let index = undefined;
        this.playerDataList.forEach((player, i) => {
            if (player && player.uid === uid) {
                index = i;
            }
        });
        return index;
    }

    private request(name, data, callback) {
        console.log("pomelo request", name, data);
        pomelo.request(name, data, (...args) => {
            console.log("pomelo response", name, ...args);
            callback(...args);
        });
    }
}

class GameScene {
    private meshTable = {};

    public init() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;

        const engine = new Engine(canvas, true, null, true);

        const scene = new Scene(engine);

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

        const meshList = ["touzi", "shaizhong", "shaizhong2"];
        meshList.forEach(name => {
            SceneLoader.ImportMesh("",
                `./assets/model/${name}/`,
                `${name}.gltf`,
                scene,
                ([mesh]) => {
                    this.meshTable[name] = mesh;
                    let count = 0;
                    for (const key in this.meshTable) {
                        if (this.meshTable.hasOwnProperty(key)) {
                            count++;
                        }
                    }
                    if (count === meshList.length) {
                        this.onModelLoaded();
                    }
                }
            );
        });
    }

    private onModelLoaded() {
    }
}

class GUI {
    public xmlLoader: XmlLoader;
    private startMusicBtn: Button;
    private returnBtn: Button;
    private helpBtn: Button;
    private helpPanel: Rectangle;
    private closeHelpBtn: Button;
    private settingBtn: Button;
    private settingPanel: SettingPanel;

    public init() {
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
        this.xmlLoader.loadLayout(Config.uiXMLPath, foreground, this.onLayoutLoaded.bind(this));

        SoundMgr.loadAudioRes(Util.values(Config.audioResTable), this.onAudioResLoaded.bind(this));
    }

    private onLayoutLoaded() {
        this.startMusicBtn = this.xmlLoader.getNodeById("startMusicBtn");
        Util.onClick(this.startMusicBtn, this.onClickStartMusicBtn.bind(this), {playSound: false});

        this.returnBtn = this.xmlLoader.getNodeById("returnBtn");
        Util.onClick(this.returnBtn, this.onClickReturnBtn.bind(this));

        this.helpBtn = this.xmlLoader.getNodeById("helpBtn");
        Util.onClick(this.helpBtn, this.onClickHelpBtn.bind(this));
        this.helpPanel = this.xmlLoader.getNodeById("helpPanel");
        this.helpPanel.isVisible = false;
        this.closeHelpBtn = this.xmlLoader.getNodeById("closeHelpBtn");
        Util.onClick(this.closeHelpBtn, this.closeHelpBtnClick.bind(this));

        this.settingBtn = this.xmlLoader.getNodeById("settingBtn");
        Util.onClick(this.settingBtn, this.onClickSettingBtn.bind(this));
        this.settingPanel = new SettingPanel(this.xmlLoader);
        this.settingPanel.isVisible = false;
    }

    private onAudioResLoaded() {
    }

    private onClickReturnBtn() {
    }

    private onClickStartMusicBtn() {
        SoundMgr.playMusic(Config.audioResTable.bgm);
        this.startMusicBtn.isVisible = false;
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
}

class Stage {
    public dataMgr: DataMgr;
    public gameScene: GameScene;
    public gui: GUI;
}

class PreparationStage extends Stage {
    private preparationRect: Rectangle;
    private prepareBtn: Button;
    private changeBtn: Button;

    public init() {
        this.preparationRect = this.gui.xmlLoader.getNodeById("preparationRect");
        this.prepareBtn = this.gui.xmlLoader.getNodeById("prepareBtn");
        Util.onClick(this.prepareBtn, this.prepareBtnClick.bind(this));
        this.changeBtn = this.gui.xmlLoader.getNodeById("changeBtn");
        Util.onClick(this.changeBtn, this.changeBtnClick.bind(this));
    }

    public set() {
        if (this.dataMgr.selfPlayerData.ready) {
            this.preparationRect.isVisible = false;
        } else {
            this.preparationRect.isVisible = true;
        }
    }

    public enter() {
    }

    public leave() {
    }

    private prepareBtnClick() {
    }

    private changeBtnClick() {
    }
}

class Main {
    private dataMgr = new DataMgr();
    private gameScene = new GameScene();
    private gui = new GUI();

    constructor() {
        this.dataMgr.init();
        this.gameScene.init();
        this.gui.init();
    }
}

new Main();
