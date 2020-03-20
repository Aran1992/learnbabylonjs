import Config from "./Config";
import {AbstractMesh, HingeJoint, Mesh, MeshBuilder, PhysicsImpostor, Quaternion, Scene, Vector3} from "babylonjs";
import PlayerDice from "./PlayerDice";

export default class PlayerCup {
    private readonly scene: Scene;
    private readonly cup: Mesh;
    private readonly joint: HingeJoint;
    private readonly dices: PlayerDice[];
    private frame: number = 0;
    private readonly createShakeList: [number, () => number | undefined][] = [
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
    private shakeList: [number, number | undefined][];

    constructor(scene: Scene, position: Vector3, diceModelTemplate: AbstractMesh, cupModelTemplate: AbstractMesh) {
        this.scene = scene;
        this.cup = this.createCup(position, cupModelTemplate);
        this.joint = this.createHingeJoint(this.cup, position);
        this.dices = this.createDices(diceModelTemplate, position);
        this.scene.registerBeforeRender(this.onFrame.bind(this));
    }

    private set isVisible(visible) {
        this.cup.isVisible = visible;
        this.cup.getChildMeshes().forEach(child => child.isVisible = visible);
    }

    public roll(dices: number[]) {
        this.shakeList = this.createShakeList.map(([frame, creator]) => [frame, creator && creator()]);
    }

    public eliminate(removeDices: number[]) {
        this.playOpen(() => {
            this.playRemove(removeDices, () => {

            });
        });
    }

    private playOpen(callback: CallableFunction) {
        this.isVisible = false;
        callback();
    }

    private playRemove(removeDices: number[], callback: CallableFunction) {
        this.dices.forEach(dice => {
            if (removeDices.indexOf(dice.point) !== -1) {
                dice.isVisible = false;
            }
        });
        callback();
    }

    private createCup(position: Vector3, cupModelTemplate: AbstractMesh) {
        const model = cupModelTemplate.clone("", null);
        model.scaling = new Vector3(Config.cup.scale, Config.cup.scale, Config.cup.scale);
        const [x, y, z] = Config.cup.position;
        model.position = new Vector3(x, y, z);

        const top = this.createThickness();

        const bottom = this.createThickness();
        bottom.position.y = -Config.cup.height - Config.cup.thickness;
        bottom.isVisible = false;

        const sides = [];
        for (let i = 0; i < Config.cup.tessellation; i++) {
            const side = this.createSide(i);
            sides.push(side);
        }

        const cup = new Mesh("");
        cup.addChild(model);
        cup.addChild(top);
        cup.addChild(bottom);
        sides.forEach(side => cup.addChild(side));

        cup.position = position;

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
        return joint;
    }

    private createDices(diceModelTemplate: AbstractMesh, cupPos: Vector3) {
        const y = -(Config.cup.height + Config.cup.thickness / 2 - Config.dice.size / 2);
        return Config.cup.dices[5].map(dicePos => {
            const position = cupPos.add(new Vector3(dicePos[0], y, dicePos[1]));
            return new PlayerDice(this, this.scene, diceModelTemplate, position);
        });
    }

    private onFrame() {
        if (this.shakeList) {
            let flag = false;
            for (let i = 0; i < this.shakeList.length; i++) {
                let shake = this.shakeList[i];
                if (this.frame < shake[0]) {
                    flag = true;
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
            if (!flag) {
                this.joint.setMotor(0);
            }
            this.frame++;
        } else {
            this.joint.setMotor(0);
        }
    }
}
