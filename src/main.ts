import {
    AbstractMesh,
    CannonJSPlugin,
    Engine,
    FreeCamera,
    HemisphericLight,
    HingeJoint,
    Mesh,
    MeshBuilder,
    PhysicsImpostor,
    Quaternion,
    Scene,
    SceneLoader,
    StandardMaterial,
    Texture,
    Vector3
} from "babylonjs";
import "babylonjs-loaders";

class Main {
    private readonly restitution = 0.1;
    private readonly friction = 0.1;
    private readonly height = 3;
    private readonly thickness = 0.2;
    private readonly diameter = 3;
    private readonly tessellation = 8;
    private readonly percent = 0.5;
    private readonly createShakeList: [number, () => number | undefined][] = [
        [10, () => -10 - Math.random()],
        [20, () => 10 + Math.random()],
        [30, () => -5 - Math.random()],
        [40, () => 5 + Math.random()],
        [50, () => -2 - Math.random()],
        [60, () => 2 + Math.random()],
        [70, () => -1 * Math.random()],
        [80, () => Math.random()],
        [90, undefined],
    ];
    private diceMesh: AbstractMesh;
    private readonly scene: Scene;
    private cup: Mesh;
    private joint: HingeJoint;
    private shakeList: [number, number | undefined][];
    private frame = 0;

    constructor() {
        this.scene = this.createScene();
        this.loadDiceMesh(() => {
            this.cup = this.createCup();
            this.createDices();
            this.joint = this.createHingeJoint();
            this.start();
        });
    }

    private createScene() {
        let canvas = document.getElementById("canvas") as HTMLCanvasElement;
        let engine = new Engine(canvas, true);
        let scene = new Scene(engine);
        const cannonJSPlugin = new CannonJSPlugin(false, 1000);
        scene.enablePhysics(undefined, cannonJSPlugin);
        let camera = new FreeCamera("", new Vector3(0, 5, -5), scene);
        camera.setTarget(Vector3.Zero());
        camera.attachControl(canvas, false);
        new HemisphericLight("", new Vector3(0, 1, 0), scene);
        engine.runRenderLoop(() => {
            scene.render();
        });
        window.addEventListener('resize', () => {
            engine.resize();
        });
        return scene;
    }

    private loadDiceMesh(callback: CallableFunction) {
        SceneLoader.ImportMesh(
            "",
            "./touzi/",
            "touzi.gltf",
            this.scene,
            (newMeshes) => {
                this.diceMesh = newMeshes[0];
                callback();
            }
        );
    }

    private createCup() {
        let opacityMaterial = new StandardMaterial("", this.scene);
        opacityMaterial.opacityTexture = new Texture("bg.png", this.scene);

        let top = this.createThickness();
        top.material = opacityMaterial;

        let bottom = this.createThickness();
        bottom.position.y = -this.height - this.thickness;

        let sides = [];
        for (let i = 0; i < this.tessellation; i++) {
            const side = this.createSide(i);
            sides.push(side);
            if (i >= this.tessellation * (1 - this.percent) / 2
                && i < this.tessellation * ((1 - this.percent) / 2 + this.percent)) {
                side.material = opacityMaterial;
            }
        }

        let cup = new Mesh("");
        cup.addChild(top);
        cup.addChild(bottom);
        sides.forEach(side => cup.addChild(side));

        top.physicsImpostor = new PhysicsImpostor(top, PhysicsImpostor.CylinderImpostor, {
            mass: 0,
            friction: this.friction,
            restitution: this.restitution,
        });
        bottom.physicsImpostor = new PhysicsImpostor(bottom, PhysicsImpostor.CylinderImpostor, {
            mass: 0,
            friction: this.friction,
            restitution: this.restitution,
        });
        sides.forEach(side => side.physicsImpostor = new PhysicsImpostor(side, PhysicsImpostor.BoxImpostor, {
            mass: 0,
            friction: this.friction,
            restitution: this.restitution,
        }));
        cup.physicsImpostor = new PhysicsImpostor(cup, PhysicsImpostor.NoImpostor, {
            mass: 1,
            friction: this.friction,
            restitution: this.restitution,
        });
        return cup;
    }

    private createThickness() {
        return MeshBuilder.CreateCylinder("", {
            diameter: this.diameter,
            height: this.thickness,
            tessellation: this.tessellation,
        });
    }

    private createSide(i) {
        let radian = Math.PI / this.tessellation;
        let width = this.diameter / 2 * Math.sin(radian) * 2;
        let side = MeshBuilder.CreateBox("", {
            width: width,
            height: this.height,
            depth: this.thickness,
        });
        let rotation = radian + radian * 2 * i;
        let innerRadius = this.diameter / 2 * Math.cos(radian) + this.thickness / 2;
        side.rotationQuaternion = Quaternion.RotationAxis(new Vector3(0, 1, 0), rotation);
        side.position.x = innerRadius * Math.sin(rotation);
        side.position.y = -(this.height + this.thickness) / 2;
        side.position.z = innerRadius * Math.cos(rotation);
        return side;
    }

    private createDices() {
        let dices = [];
        let count = 5;
        let size = 0.5;
        let modelScale2Size = 0.005875;
        let modelScale = size / modelScale2Size;
        let centerDistance = 0.75;
        let y = size / 2 - (this.height + this.thickness / 2);
        let dicesPos = [
            [0, y, 0],
            [centerDistance, y, 0],
            [-centerDistance, y, 0],
            [0, y, centerDistance],
            [0, y, -centerDistance],
        ];
        for (let i = 0; i < count; i++) {
            let model = this.diceMesh.clone("", null);
            model.scaling = new Vector3(modelScale, modelScale, modelScale);

            let collider = Mesh.CreateBox("", size);
            collider.isVisible = false;

            let dice = new Mesh("");
            dice.addChild(model);
            dice.addChild(collider);
            dice.position.x = dicesPos[i][0];
            dice.position.y = dicesPos[i][1];
            dice.position.z = dicesPos[i][2];

            collider.physicsImpostor = new PhysicsImpostor(collider, PhysicsImpostor.BoxImpostor, {mass: 0});
            dice.physicsImpostor = new PhysicsImpostor(dice, PhysicsImpostor.NoImpostor, {
                mass: 1,
                friction: this.friction,
                restitution: this.restitution
            });

            dices.push(dice);
        }
        return dices;
    }

    private createHingeJoint() {
        let holder = MeshBuilder.CreateSphere("holder", {diameter: this.thickness, segments: 4});
        holder.isVisible = false;
        holder.physicsImpostor = new PhysicsImpostor(holder, PhysicsImpostor.SphereImpostor, {mass: 0});
        let joint = new HingeJoint({
            mainPivot: new Vector3(0, 0, 0),
            connectedPivot: new Vector3(0, 0, 0),
            mainAxis: new Vector3(0, 0, -1,),
            connectedAxis: new Vector3(0, 0, -1,),
            nativeParams: {}
        });
        holder.physicsImpostor.addJoint(this.cup.physicsImpostor, joint);
        return joint;
    }

    private start() {
        this.frame = 0;
        this.shakeList = this.createShakeList.map(([frame, creator]) => [frame, creator && creator()]);
        this.scene.onBeforePhysicsObservable.add(this.onBeforePhysicsObservable.bind(this));
    }

    private onBeforePhysicsObservable() {
        let flag = false;
        for (let i = 0; i < this.shakeList.length; i++) {
            let shake = this.shakeList[i];
            if (this.frame < shake[0]) {
                flag = true;
                if (shake[1]) {
                    this.joint.setMotor(shake[1], 1000);
                } else {
                    let a = this.cup.rotationQuaternion.toEulerAngles();
                    let time = (shake[0] - this.frame) / 60;
                    let v = -a.z / time;
                    this.joint.setMotor(v, 1000);
                }
                break;
            }
        }
        if (!flag) {
            this.joint.setMotor(0, 1000);
        }
        this.frame++;
    }
}

new Main();
