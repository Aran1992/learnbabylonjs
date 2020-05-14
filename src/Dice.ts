import {AbstractMesh, Mesh, Scene, Vector3} from "babylonjs";
import Config from "./Config";
import Util from "./Util";

export default class Dice extends Mesh {
    private scene: Scene;
    private sides: { mesh: Mesh, point: number }[];

    constructor(scene: Scene, diceModelTemplate: AbstractMesh, position: Vector3) {
        super("");

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

        this.addChild(model);
        this.sides.forEach(side => this.addChild(side.mesh));

        this.position = position;
    }

    public get point(): number {
        return this.sides.sort((a, b) => Util.getWorldPosition(b.mesh).y - Util.getWorldPosition(a.mesh).y)[0].point;
    }

    public set point(point: number) {
        this.rotationQuaternion = new Vector3(...Config.dice.sides.filter(side => side.point === point)[0].rotation).toQuaternion();
    }

    public getVisibility() {
        return this.getMesh().visibility;
    }

    public setVisibility(visibility: number) {
        if (visibility < 0) {
            visibility = 0;
        } else if (visibility > 1) {
            visibility = 1;
        }
        this.getMesh().visibility = visibility;
    }

    private getMesh() {
        return this.getChildMeshes()[1];
    }
}
