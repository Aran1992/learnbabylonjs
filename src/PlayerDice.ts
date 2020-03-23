import {AbstractMesh, Mesh, PhysicsImpostor, Scene, Vector3} from "babylonjs";
import Config from "./Config";
import Util from "./Util";

export default class PlayerDice {
    private readonly scene: Scene;
    private readonly mesh: Mesh;
    private readonly model: AbstractMesh;
    private sides: { mesh: Mesh, point: number }[];
    private initY: number;

    constructor(scene: Scene, diceModelTemplate: AbstractMesh, position: Vector3, isPhysical: boolean) {
        this.scene = scene;

        this.model = diceModelTemplate.clone("", null);
        this.model.scaling = new Vector3(Config.dice.scale, Config.dice.scale, Config.dice.scale);

        let collider;
        if (isPhysical) {
            collider = Mesh.CreateBox("", Config.dice.size);
            collider.isVisible = false;
        }

        this.sides = Config.dice.sides.map(({position, point}) => {
            let mesh = Mesh.CreateBox("", 0);
            position = position.map(p => p * Config.dice.size / 2);
            mesh.position = new Vector3(position[0], position[1], position[2]);
            mesh.isVisible = false;
            return {mesh, point};
        });

        this.mesh = new Mesh("");
        this.mesh.addChild(this.model);
        if (isPhysical) {
            this.mesh.addChild(collider);
        }
        this.sides.forEach(side => this.mesh.addChild(side.mesh));

        this.mesh.position = position;
        this.initY = this.mesh.position.y;

        if (isPhysical) {
            collider.physicsImpostor = new PhysicsImpostor(collider, PhysicsImpostor.BoxImpostor, {mass: 0});
            this.mesh.physicsImpostor = new PhysicsImpostor(this.mesh, PhysicsImpostor.NoImpostor, {
                mass: 1,
                friction: Config.friction,
                restitution: Config.restitution
            });
        }
    }

    public get point() {
        return this.sides.sort((a, b) => Util.getWorldPosition(b.mesh).y - Util.getWorldPosition(a.mesh).y)[0].point;
    }

    public set position(p: Vector3) {
        this.mesh.position = p;
    }

    public get isStatic() {
        const offset = 0.01;
        return this.mesh.position.y > this.initY - offset && this.mesh.position.y < this.initY + offset;
    }

    public dispose() {
        this.mesh.dispose();
    }

    public disposePhysicsImpostor() {
        this.mesh.physicsImpostor.dispose();
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

