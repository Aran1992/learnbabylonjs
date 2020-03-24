import Config from "./Config";
import PhysicalDice from "./PhysicalDice";
import {HingeJoint, Mesh, MeshBuilder, PhysicsImpostor, Quaternion, Scene, Vector3} from "babylonjs";

export default class PhysicalCup {
    protected readonly cup: Mesh;
    protected readonly joint: HingeJoint;
    protected readonly holder: Mesh;
    protected readonly dices: PhysicalDice[];
    private frame = 0;
    private shakeList = [];
    private rollCallback: CallableFunction;
    private scene: Scene;
    private frameHandler;

    constructor(position: Vector3, scene: Scene) {
        this.scene = scene;
        this.cup = this.createCup(position);
        const {holder, joint} = this.createHingeJoint(this.cup, position);
        this.holder = holder;
        this.joint = joint;
        this.dices = this.createDices(this.cup.position);
        this.frameHandler = this.onFrame.bind(this);
        this.scene.registerBeforeRender(this.frameHandler);
    }

    public dispose() {
        this.scene.unregisterBeforeRender(this.frameHandler);
        this.dices.forEach(dice => dice.dispose());
        this.holder.dispose();
        this.cup.dispose();
    }

    public roll(args, callback) {
        this.shakeList = args;
        this.rollCallback = callback;
    }

    private createCup(position: Vector3) {
        const top = this.createThickness();

        const bottom = this.createThickness();
        bottom.position.y = -Config.cup.height - Config.cup.thickness;

        const sides = [];
        for (let i = 0; i < Config.cup.tessellation; i++) {
            const side = this.createSide(i);
            sides.push(side);
        }

        const cup = new Mesh("");
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
        t.isVisible = true;
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
        side.isVisible = true;
        return side;
    }

    private createHingeJoint(cup: Mesh, position: Vector3) {
        const holder = MeshBuilder.CreateSphere("", {diameter: 0});
        holder.position = position;
        holder.isVisible = true;
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


    private createDices(cupPos: Vector3) {
        const y = -(Config.cup.height + Config.cup.thickness / 2 - Config.dice.size / 2);
        return Config.cup.dices[Config.cup.initCount].map(dicePos => {
            const position = cupPos.add(new Vector3(dicePos[0], y, dicePos[1]));
            return new PhysicalDice(position);
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
            if (this.frame >= 300) {
                if (!this.dices.some(dice => !dice.isStatic)) {
                    this.rollCallback(this.dices.map(dice => dice.point).sort().join(","));
                } else {
                    this.rollCallback();
                }
            }
            this.frame++;
        } else {
            this.joint.setMotor(0);
            this.cup.rotationQuaternion = new Quaternion();
        }
    }
}
