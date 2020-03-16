import {CannonJSPlugin, Engine, FreeCamera, HemisphericLight, Scene, SceneLoader, Vector3} from "babylonjs";
import "babylonjs-loaders";
import Config from "./Config";
import PlayerCup from "./PlayerCup";
import OtherCup from "./OtherCup";

export default class GameScene {
    private readonly scene: Scene;
    private playerCup: PlayerCup;
    private otherCups: OtherCup[];

    constructor() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const engine = new Engine(canvas, true, null, true);
        this.scene = new Scene(engine);
        const cannonJSPlugin = new CannonJSPlugin(false);
        this.scene.enablePhysics(null, cannonJSPlugin);
        const camera = new FreeCamera("", new Vector3(0, 18, 0), this.scene);
        camera.setTarget(Vector3.Zero());
        // 不知道为啥默认旋转角度不是0 需要转回来
        camera.rotation.y = 0;
        camera.attachControl(canvas);
        new HemisphericLight("", new Vector3(0, 1, 1), this.scene);
        engine.runRenderLoop(() => {
            this.scene.render();
        });
        SceneLoader.ImportMesh("",
            "./assets/model/touzi/",
            "touzi.gltf",
            this.scene,
            this.onLoaded.bind(this)
        );
    }

    private onLoaded([diceModelTemplate]) {
        const [playerCup, ...otherCups] = Config.cups;
        this.playerCup = new PlayerCup(this.scene, new Vector3(playerCup[0], 0, playerCup[1]), diceModelTemplate);
        this.otherCups = otherCups.map(([x, z]) => new OtherCup(this.scene, new Vector3(x, 0, z), diceModelTemplate));
    }

    public onStart() {
        // 自己的盅根据结果开始摇
        this.playerCup.roll();
        // 别人的盅开始假摇
        this.otherCups.forEach(cup => cup.roll());
    }

    public onEliminate(point: number) {
        this.playerCup.eliminate(point, () => {
        });
        // this.otherCups.eliminate(point);
    }
}
