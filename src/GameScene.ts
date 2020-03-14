import {CannonJSPlugin, Engine, FreeCamera, HemisphericLight, Scene, SceneLoader, Vector3} from "babylonjs";
import "babylonjs-loaders";
import Config from "./Config";
import PlayerCup from "./PlayerCup";
import OtherCup from "./OtherCup";

export default class GameScene {
    private playerCup: PlayerCup;
    private otherCups: OtherCup[];

    constructor() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const engine = new Engine(canvas, true, null, true);
        const scene = new Scene(engine);
        const cannonJSPlugin = new CannonJSPlugin(false);
        scene.enablePhysics(null, cannonJSPlugin);
        const camera = new FreeCamera("", new Vector3(0, 20, 0), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(canvas);
        new HemisphericLight("", new Vector3(0, 1, 1), scene);
        engine.runRenderLoop(() => {
            scene.render();
        });
        SceneLoader.ImportMesh("",
            "./assets/model/touzi/",
            "touzi.gltf",
            scene,
            ([diceModelTemplate]) => {
                const [playerCup, ...otherCups] = Config.cups;
                this.playerCup = new PlayerCup(scene, new Vector3(playerCup[0], 0, playerCup[1]), diceModelTemplate);
                this.otherCups = otherCups.map(([x, z]) => new OtherCup(new Vector3(x, 0, z), diceModelTemplate));
            }
        );
    }
}
