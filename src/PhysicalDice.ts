import {Mesh, PhysicsImpostor, Vector3} from "babylonjs";
import Config from "./Config";
import Util from "./Util";

export default class PhysicalDice {
    private readonly mesh: Mesh;
    private sides: { mesh: Mesh, point: number }[];
    private initY: number;

    constructor(position: Vector3) {
        let collider = Mesh.CreateBox("", Config.dice.size);
        collider.isVisible = true;

        this.sides = Config.dice.sides.map(({position, point}) => {
            let mesh = Mesh.CreateBox("", 0);
            position = position.map(p => p * Config.dice.size / 2);
            mesh.position = new Vector3(position[0], position[1], position[2]);
            mesh.isVisible = true;
            return {mesh, point};
        });

        this.mesh = new Mesh("");
        this.mesh.addChild(collider);
        this.sides.forEach(side => this.mesh.addChild(side.mesh));

        this.mesh.position = position;
        this.initY = this.mesh.position.y;

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

    public get position() {
        return this.mesh.position;
    }

    public get rotationQuaternion() {
        return this.mesh.rotationQuaternion;
    }

    public get isStatic() {
        const offset = 0.01;
        return this.mesh.position.y > this.initY - offset && this.mesh.position.y < this.initY + offset;
    }

    public dispose() {
        this.mesh.physicsImpostor.dispose();
        this.mesh.dispose();
    }
}
