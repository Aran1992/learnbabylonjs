import Config from "./Config";
import {AbstractMesh, HingeJoint, Mesh, MeshBuilder, PhysicsImpostor, Quaternion, Scene, Vector3} from "babylonjs";
import PlayerDice from "./PlayerDice";

export default class PlayerCup {
    private scene: Scene;
    private position: Vector3;
    private diceModelTemplate: AbstractMesh;
    private cupModelTemplate: AbstractMesh;
    private cup: Mesh;
    private dices: PlayerDice[];
    private holder: Mesh;
    private joint: HingeJoint;
    private count: number;
    private frame: number;
    private onFrameHandler;
    private shakeList: [number, number | undefined][];
    private createShakeList: [number, () => number | undefined][] = [
        [10, () => -5 - Math.random()],
        [20, () => 5 + Math.random()],
        [30, () => -4 - Math.random()],
        [40, () => 4 + Math.random()],
        [50, () => -2 - Math.random()],
        [60, () => 2 + Math.random()],
        [70, () => -1 * Math.random()],
        [80, () => Math.random()],
        [90, undefined],
    ];
    private targetPoints: number[];
    private rollEndedCallback: CallableFunction;

    constructor(scene: Scene, position: Vector3, diceModelTemplate: AbstractMesh, cupModelTemplate: AbstractMesh) {
        this.scene = scene;
        this.position = position;
        this.diceModelTemplate = diceModelTemplate;
        this.cupModelTemplate = cupModelTemplate;
        this.count = Config.cup.initCount;
        this.cup = this.createCup(this.position, this.cupModelTemplate, false);
        this.dices = this.createDices(this.count, this.diceModelTemplate, this.position, false);
    }

    public reset(count?: number) {
        this.clear();
        this.count = count === undefined ? this.count : count;
        this.cup = this.createCup(this.position, this.cupModelTemplate, false);
        this.dices = this.createDices(this.count, this.diceModelTemplate, this.position, false);
    }

    public roll(points: number[], callback?: CallableFunction) {
        this.rollEndedCallback = callback;
        this.targetPoints = points;
        this.clear();
        this.cup = this.createCup(this.position, this.cupModelTemplate, true);
        const {joint, holder} = this.createHingeJoint(this.cup, this.cup.position);
        this.joint = joint;
        this.holder = holder;
        this.dices = this.createDices(this.count, this.diceModelTemplate, this.position, true);
        this.shakeList = this.createShakeList.map(([frame, creator]) => [frame, creator && creator()]);
        this.frame = 0;
        this.onFrameHandler = this.onFrame.bind(this);
        this.scene.registerBeforeRender(this.onFrameHandler);
    }

    public eliminate(removeDices: number[], callback?: CallableFunction) {
        this.playOpen(() => {
            this.playEliminate(removeDices, () => {
                callback && callback();
            });
        });
    }

    private clear() {
        if (this.cup) {
            this.cup.dispose();
            delete this.cup;
        }
        if (this.holder) {
            this.holder.dispose();
            delete this.holder;
        }
        if (this.dices) {
            this.dices.forEach(dice => dice.dispose());
            this.dices = [];
        }
    }

    private playOpen(callback: CallableFunction) {
        const frameHandler = () => {
            const mesh = this.cup.getChildMeshes()[0].getChildMeshes()[0];
            mesh.visibility -= 1 / (Config.openCupDuration / 1000 * Config.fps);
            if (mesh.visibility <= 0) {
                this.scene.unregisterBeforeRender(frameHandler);
                callback();
            }
        };
        this.scene.registerBeforeRender(frameHandler);
    }

    private playEliminate(removeDices: number[], callback: CallableFunction) {
        let count = 0;
        this.dices.forEach(dice => {
            if (removeDices.indexOf(dice.point) !== -1) {
                count++;
                dice.playEliminate(() => {
                    count--;
                    if (count === 0) {
                        callback();
                    }
                });
            }
        });
        this.count -= count;
        if (count === 0) {
            callback();
        }
    }

    private createCup(position: Vector3, cupModelTemplate: AbstractMesh, isPhysical: boolean) {
        const model = cupModelTemplate.clone("", null);
        model.scaling = new Vector3(Config.cup.scale, Config.cup.scale, Config.cup.scale);
        const [x, y, z] = Config.cup.position;
        model.position = new Vector3(x, y, z);

        let top, bottom, sides;
        if (isPhysical) {
            top = this.createThickness();

            bottom = this.createThickness();
            bottom.position.y = -Config.cup.height - Config.cup.thickness;

            sides = [];
            for (let i = 0; i < Config.cup.tessellation; i++) {
                const side = this.createSide(i);
                sides.push(side);
            }
        }

        const cup = new Mesh("");
        cup.addChild(model);
        if (isPhysical) {
            cup.addChild(top);
            cup.addChild(bottom);
            sides.forEach(side => cup.addChild(side));
        }

        cup.position = position;

        if (isPhysical) {
            top.physicsImpostor = new PhysicsImpostor(top, PhysicsImpostor.CylinderImpostor, {
                mass: 0,
                friction: Config.friction,
                restitution: Config.restitution,
            });
            bottom.physicsImpostor = new PhysicsImpostor(bottom, PhysicsImpostor.CylinderImpostor, {
                mass: 0,
                friction: Config.friction,
                restitution: Config.restitution,
            });
            sides.forEach(side => side.physicsImpostor = new PhysicsImpostor(side, PhysicsImpostor.BoxImpostor, {
                mass: 0,
                friction: Config.friction,
                restitution: Config.restitution,
            }));
            cup.physicsImpostor = new PhysicsImpostor(cup, PhysicsImpostor.NoImpostor, {
                mass: 1,
                friction: Config.friction,
                restitution: Config.restitution,
            });
        }

        return cup;
    }

    private createThickness() {
        const t = MeshBuilder.CreateCylinder("", {
            diameter: Config.cup.diameter,
            height: Config.cup.thickness,
            tessellation: Config.cup.tessellation,
        });
        t.isVisible = false;
        return t;
    }

    private createSide(i) {
        let radian = Math.PI / Config.cup.tessellation;
        let width = Config.cup.diameter / 2 * Math.sin(radian) * 2;
        let side = MeshBuilder.CreateBox("", {
            width: width,
            height: Config.cup.height,
            depth: Config.cup.thickness,
        });
        let rotation = radian + radian * 2 * i;
        let innerRadius = Config.cup.diameter / 2 * Math.cos(radian) + Config.cup.thickness / 2;
        side.rotationQuaternion = Quaternion.RotationAxis(new Vector3(0, 1, 0), rotation);
        side.position.x = innerRadius * Math.sin(rotation);
        side.position.y = -(Config.cup.height + Config.cup.thickness) / 2;
        side.position.z = innerRadius * Math.cos(rotation);
        side.isVisible = false;
        return side;
    }

    private createHingeJoint(cup: Mesh, position: Vector3) {
        const holder = MeshBuilder.CreateSphere("", {diameter: 0});
        holder.position = position;
        holder.isVisible = false;
        holder.physicsImpostor = new PhysicsImpostor(holder, PhysicsImpostor.SphereImpostor, {mass: 0});
        const joint = new HingeJoint({
            mainPivot: new Vector3(0, 0, 0),
            connectedPivot: new Vector3(0, 0, 0),
            mainAxis: new Vector3(0, 0, -1,),
            connectedAxis: new Vector3(0, 0, -1,),
            nativeParams: {}
        });
        holder.physicsImpostor.addJoint(cup.physicsImpostor, joint);
        return {joint, holder};
    }

    private createDices(count: number, diceModelTemplate: AbstractMesh, cupPos: Vector3, isPhysical: boolean) {
        const y = -(Config.cup.height + Config.cup.thickness / 2 - Config.dice.size / 2);
        return Config.cup.dices[count].map(dicePos => {
            const position = cupPos.add(new Vector3(dicePos[0], y, dicePos[1]));
            return new PlayerDice(this.scene, diceModelTemplate, position, isPhysical);
        });
    }

    private onFrame() {
        if (this.shakeList) {
            let ended = false;
            for (let i = 0; i < this.shakeList.length; i++) {
                let shake = this.shakeList[i];
                if (this.frame < shake[0]) {
                    ended = true;
                    if (shake[1]) {
                        this.joint.setMotor(shake[1]);
                    } else {
                        let a = this.cup.rotationQuaternion.toEulerAngles();
                        let time = (shake[0] - this.frame) / 60;
                        let v = -a.z / time;
                        this.joint.setMotor(v);
                    }
                    break;
                }
            }
            if (!ended) {
                this.joint.setMotor(0);
                this.cup.rotationQuaternion = new Quaternion();
            }
            if (this.frame >= Config.rollAnimationDuration / 1000 * Config.fps) {
                this.cup.physicsImpostor.dispose();
                this.holder.dispose();
                delete this.holder;
                this.dices.forEach(dice => dice.disposePhysicsImpostor());
                this.scene.unregisterBeforeRender(this.onFrameHandler);
                this.dices.forEach((dice, i) => dice.point = this.targetPoints[i]);
                if (!this.dices.some(dice => !dice.isStatic)) {
                    console.log(this.dices.map(dice => dice.point).sort().join(","));
                } else {
                    console.log();
                }
                if (this.rollEndedCallback) {
                    this.rollEndedCallback();
                }
            }
            this.frame++;
        } else {
            this.joint.setMotor(0);
            this.cup.rotationQuaternion = new Quaternion();
        }
    }
}
