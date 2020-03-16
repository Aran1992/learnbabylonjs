import Config from "./Config";
import {
    AbstractMesh,
    HingeJoint,
    Mesh,
    MeshBuilder,
    PhysicsImpostor,
    Quaternion,
    Scene,
    StandardMaterial,
    Texture,
    Vector3
} from "babylonjs";
import PlayerDice from "./PlayerDice";

export default class PlayerCup {
    private readonly scene: Scene;
    private readonly cup: Mesh;
    private readonly joint: HingeJoint;
    private readonly dices: PlayerDice[];
    private rollArgs: number[] = [];
    private frame: number = 0;

    constructor(scene: Scene, position: Vector3, diceModelTemplate: AbstractMesh) {
        this.scene = scene;
        this.cup = this.createCup(scene, position);
        this.joint = this.createHingeJoint(this.cup, position);
        this.dices = this.createDices(diceModelTemplate, position);
        this.scene.registerBeforeRender(this.onFrame.bind(this));
    }

    public roll(points: number[]) {
        this.shakeList = [];
    }

    private createCup(scene: Scene, position: Vector3) {
        const opacityMaterial = new StandardMaterial("", scene);
        opacityMaterial.opacityTexture = new Texture(Config.cup.texturePath, null);

        const top = this.createThickness();
        top.material = opacityMaterial;

        const bottom = this.createThickness();
        bottom.position.y = -Config.cup.height - Config.cup.thickness;
        bottom.isVisible = false;

        const sides = [];
        for (let i = 0; i < Config.cup.tessellation; i++) {
            const side = this.createSide(i);
            sides.push(side);
            if (i >= Config.cup.tessellation * (1 - Config.cup.opacityPartPercent) / 2
                && i < Config.cup.tessellation * ((1 - Config.cup.opacityPartPercent) / 2 + Config.cup.opacityPartPercent)) {
                side.material = opacityMaterial;
            }
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
        return MeshBuilder.CreateCylinder("", {
            diameter: Config.cup.diameter,
            height: Config.cup.thickness,
            tessellation: Config.cup.tessellation,
        });
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
        return Config.cup.dices.map(dicePos => {
            const position = cupPos.add(new Vector3(dicePos[0], y, dicePos[1]));
            return new PlayerDice(diceModelTemplate, position);
        });
    }

    private onFrame() {
        let flag = false;
        for (let i = 0; i < this.shakeList.length; i++) {
            let shake = this.shakeList[i];
            if (this.frame < shake[0]) {
                flag = true;
                if (shake[1]) {
                    this.cups.forEach(cup => cup.setMotor(shake[1]));
                } else {
                    this.cups.forEach(cup => {
                        let a = cup.getEulerAngles();
                        let time = (shake[0] - this.frame) / 60;
                        let v = -a.z / time;
                        cup.setMotor(v);
                    });
                }
                break;
            }
        }
        if (!flag) {
            this.cups.forEach(cup => cup.setMotor(0));
            if (!this.cups.some(cup => cup.isDynamic())) {
                this.cups.forEach((cup, i) => {
                    console.log(i, cup.getPoints());
                });
            }
        }
        this.joint.setMotor(0);
    }
}
