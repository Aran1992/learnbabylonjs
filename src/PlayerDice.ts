import {AbstractMesh, Mesh, PhysicsImpostor, Vector3} from "babylonjs";
import Config from "./Config";

export default class PlayerDice {
    private readonly mesh: Mesh;
    private sides: { mesh: Mesh, point: number }[];

    constructor(diceModelTemplate: AbstractMesh, position: Vector3) {
        let model = diceModelTemplate.clone("", null);
        model.scaling = new Vector3(Config.dice.scale, Config.dice.scale, Config.dice.scale);

        let collider = Mesh.CreateBox("", Config.dice.size);
        collider.isVisible = false;

        this.sides = Config.dice.sides.map(({position, point}) => {
            let mesh = Mesh.CreateBox("", 0);
            position = position.map(p => p * Config.dice.size / 2);
            mesh.position = new Vector3(position[0], position[1], position[2]);
            mesh.isVisible = false;
            return {mesh, point};
        });

        this.mesh = new Mesh("");
        this.mesh.addChild(model);
        this.mesh.addChild(collider);
        this.sides.forEach(side => this.mesh.addChild(side.mesh));

        this.mesh.position = position;

        collider.physicsImpostor = new PhysicsImpostor(collider, PhysicsImpostor.BoxImpostor, {mass: 0});
        this.mesh.physicsImpostor = new PhysicsImpostor(this.mesh, PhysicsImpostor.NoImpostor, {
            mass: 1,
            friction: Config.friction,
            restitution: Config.restitution
        });
    }
}
