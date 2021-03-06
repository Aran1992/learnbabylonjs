import {CannonJSPlugin, Engine, FreeCamera, HemisphericLight, Scene, SceneLoader, Vector3} from "babylonjs";
import "babylonjs-loaders";
import Config from "./Config";
import PlayerCup from "./PlayerCup";
import OtherCup from "./OtherCup";
import GameMgr from "./GameMgr";
import PlayerData from "./PlayerData";

declare const addPercent;

export default class GameScene {
    private readonly scene: Scene;
    private playerCup: PlayerCup;
    private otherCups: OtherCup[] = [];
    private loaded: boolean;
    private meshTable = {};

    constructor() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const engine = new Engine(canvas, true, null, true);
        this.scene = new Scene(engine);
        const cannonJSPlugin = new CannonJSPlugin(false);
        this.scene.enablePhysics(null, cannonJSPlugin);
        const [x, y, z] = Config.camera.pos;
        const camera = new FreeCamera("", new Vector3(x, y, z), this.scene);
        const [tx, ty, tz] = Config.camera.target;
        camera.setTarget(new Vector3(tx, ty, tz));
        // 不知道为啥默认旋转角度不是0 需要转回来
        camera.rotation.y = 0;
        // camera.attachControl(canvas);
        new HemisphericLight("", new Vector3(1, 1, -1), this.scene);
        engine.runRenderLoop(() => {
            this.scene.render();
        });
        const meshList = ["touzi", "shaizhong", "shaizhong2"];
        meshList.forEach(name => {
            SceneLoader.ImportMesh("",
                `./assets/model/${name}/`,
                `${name}.gltf`,
                this.scene,
                ([mesh]) => {
                    this.meshTable[name] = mesh;
                    let count = 0;
                    for (const key in this.meshTable) {
                        if (this.meshTable.hasOwnProperty(key)) {
                            count++;
                        }
                    }
                    if (count === meshList.length) {
                        this.onSceneLoaded();
                    }
                }
            );
        });
        [
            "onGameInited"
        ].forEach(event => {
            if (this[event]) {
            }
        });
    }

    public onGameInited() {
        if (this.loaded && GameMgr.inited) {
            GameMgr.otherPlayerDataList.forEach(info => info && this.createCup(info));
        }
    }

    public onEnterRoom(data) {
        this.createCup(GameMgr.getPlayerDataByUid(data.uid));
    }

    public removePlayer(index: number) {
        const cup = this.otherCups[index];
        if (cup) {
            cup.dispose();
            delete this.otherCups[index];
        }
    }

    public selfRoll() {
        if (GameMgr.selfPlayerData.ready) {
            this.playerCup.roll(GameMgr.selfPlayerData.dice, () => {
                GameMgr.selfPlayerData.rolled = true;
                this.onPlayerRollEnded();
            });
        }
    }

    public otherPlayersRandomRoll() {
        const now = new Date().getTime();
        const diff = GameMgr.rollFinalTime - now;
        GameMgr.otherPlayerDataList.forEach((data, i) => {
            if (data.ready) {
                const cup = this.otherCups[i];
                const timeout = diff * Math.random();
                console.log("timeout", timeout);
                setTimeout(() => cup.roll(() => {
                    GameMgr.otherPlayerDataList[i].rolled = true;
                    this.onPlayerRollEnded();
                }), timeout);
            }
        });
    }

    public onStartForBamao() {
        this.playerCup.reset(Config.cup.initCount);
        this.otherCups.forEach(cup => cup && cup.reset());
    }

    public onEliminateStartForBamao() {
        this.playerCup.reset();
        this.otherCups.forEach(cup => cup && cup.reset());
    }

    public onEliminateOpeForBamao(data) {
        if (GameMgr.selfPlayerData.ready) {
            this.playerCup.eliminate(data.removeDice);
        }
        for (const seat in data.befDice) {
            if (data.befDice.hasOwnProperty(seat)) {
                const dice = data.befDice[seat];
                const index = GameMgr.getPlayerIndexBySeat(parseInt(seat));
                if (this.otherCups[index]) {
                    this.otherCups[index].eliminate(dice, data.removeDice || []);
                }
            }
        }
    }

    private onSceneLoaded() {
        addPercent(0.2);
        const [playerCup] = Config.cups;
        this.playerCup = new PlayerCup(this.scene, new Vector3(playerCup[0], 0, playerCup[1]),
            this.meshTable["touzi"], this.meshTable["shaizhong"]);
        this.loaded = true;
        // const [_, ...otherCups] = Config.cups;
        // otherCups.forEach(([x, z], index) => {
        //     this.otherCups[index] = new OtherCup(this.scene, new Vector3(x, 0, z),
        //         this.meshTable["touzi"], this.meshTable["shaizhong2"]);
        // });
        this.onGameInited();
    }

    private createCup(info: PlayerData) {
        const index = GameMgr.getPlayerIndexBySeat(info.seatNum);
        const [x, z] = Config.cups[index];
        this.otherCups[index] = new OtherCup(this.scene, new Vector3(x, 0, z),
            this.meshTable["touzi"], this.meshTable["shaizhong2"]);
    }

    private onPlayerRollEnded() {
        if (GameMgr.isAllPlayerRollEnded) {
        }
    }
}
