import {AbstractMesh, Mesh, PhysicsImpostor, Quaternion, Scene, Vector3} from "babylonjs";
import Config from "./Config";
import Util from "./Util";
import PlayerCup from "./PlayerCup";

export default class PlayerDice {
    private parent: PlayerCup;
    private readonly scene: Scene;
    private readonly mesh: Mesh;
    private readonly model: AbstractMesh;
    private sides: { mesh: Mesh, point: number }[];

    constructor(parent: PlayerCup, scene: Scene, diceModelTemplate: AbstractMesh, position: Vector3) {
        this.parent = parent;
        this.scene = scene;

        this.model = diceModelTemplate.clone("", null);
        this.model.scaling = new Vector3(Config.dice.scale, Config.dice.scale, Config.dice.scale);

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
        this.mesh.addChild(this.model);
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

    public get point() {
        return this.sides.sort((a, b) => Util.getWorldPosition(b.mesh).y - Util.getWorldPosition(a.mesh).y)[0].point;
    }

    public set position(p: Vector3) {
        this.mesh.position = p;
    }

    public set rotationQuaternion(p: Quaternion) {
        this.mesh.rotationQuaternion = p;
    }

    public get isVisible() {
        return this.model.getChildMeshes()[0].isVisible;
    }

    public set isVisible(visible) {
        this.model.getChildMeshes()[0].isVisible = visible;
    }

    public dispose() {
        this.mesh.dispose();
    }
}

