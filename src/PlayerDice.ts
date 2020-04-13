import {AbstractMesh, Mesh, PhysicsImpostor, Scene, Vector3} from "babylonjs";
import Config from "./Config";
import Util from "./Util";

export default class PlayerDice {
    private readonly scene: Scene;
    private readonly mesh: Mesh;
    private sides: { mesh: Mesh, point: number }[];
    private initY: number;

    constructor(scene: Scene, diceModelTemplate: AbstractMesh, position: Vector3, isPhysical: boolean) {
        this.scene = scene;

        const model = diceModelTemplate.clone("", null);
        model.scaling = new Vector3(Config.dice.scale, Config.dice.scale, Config.dice.scale);

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
        this.mesh.addChild(model);
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

    public set point(point: number) {
        this.mesh.rotationQuaternion = new Vector3(...Config.dice.sides.find(side => side.point === point).rotation).toQuaternion();
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
        let count = Config.diceDisappearAnimation.twinkTimes;
        const mesh = this.mesh.getChildMeshes()[0].getChildMeshes()[0];
        let delta = -1 / (Config.diceDisappearAnimation.duration / 1000 / (count * 2 - 1) * Config.fps);
        const frameHandler = () => {
            if (delta < 0) {
                mesh.visibility += delta;
                if (mesh.visibility <= 0) {
                    mesh.visibility = 0;
                    count--;
                    if (count === 0) {
                        this.scene.unregisterBeforeRender(frameHandler);
                        callback();
                    } else {
                        delta = -delta;
                    }
                }
            } else {
                mesh.visibility += delta;
                if (mesh.visibility >= 1) {
                    mesh.visibility = 1;
                    delta = -delta;
                }
            }
        };
        this.scene.registerBeforeRender(frameHandler);
    }
}

