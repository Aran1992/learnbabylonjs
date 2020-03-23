import {AbstractMesh, Mesh, Scene, Vector3} from "babylonjs";
import Config from "./Config";
import Util from "./Util";

export default class OtherDice {
    private scene: Scene;
    private readonly mesh: Mesh;
    private sides: { mesh: Mesh, point: number }[];

    constructor(scene: Scene, diceModelTemplate: AbstractMesh, position: Vector3, point: number) {
        this.scene = scene;

        let model = diceModelTemplate.clone("", null);
        model.scaling = new Vector3(Config.dice.scale, Config.dice.scale, Config.dice.scale);

        this.sides = Config.dice.sides.map(({position, point}) => {
            let mesh = Mesh.CreateBox("", 0);
            position = position.map(p => p * Config.dice.size / 2);
            mesh.position = new Vector3(position[0], position[1], position[2]);
            mesh.isVisible = false;
            return {mesh, point};
        });

        this.mesh = new Mesh("");
        this.mesh.addChild(model);

        this.mesh.position = position;
    }

    public get point() {
        return this.sides.sort((a, b) => Util.getWorldPosition(b.mesh).y - Util.getWorldPosition(a.mesh).y)[0].point;
    }

    public dispose() {
        this.mesh.dispose();
    }

    public playEliminate(callback: CallableFunction) {
        const frameHandler = () => {
            const mesh = this.mesh.getChildMeshes()[0].getChildMeshes()[0];
            mesh.visibility -= 1 / 60;
            if (mesh.visibility <= 0) {
                this.scene.unregisterBeforeRender(frameHandler);
                callback();
            }
        };
        this.scene.registerBeforeRender(frameHandler);
    }
}
