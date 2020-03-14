import {AbstractMesh, Mesh, PhysicsImpostor, Vector3} from "babylonjs";
import Config from "./Config";

export default class OtherDice {
    private readonly mesh: Mesh;

    constructor(diceModelTemplate: AbstractMesh, position: Vector3) {
        let model = diceModelTemplate.clone("", null);
        model.scaling = new Vector3(Config.dice.scale, Config.dice.scale, Config.dice.scale);

        this.mesh = new Mesh("");
        this.mesh.addChild(model);

        this.mesh.position = position;
    }
}
