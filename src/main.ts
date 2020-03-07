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
    Vector3,
} from "babylonjs";
import "babylonjs-loaders";
import {AdvancedDynamicTexture, Button, Image, XmlLoader} from "babylonjs-gui";
import {EventState} from "babylonjs/Misc/observable";

class Util {
    public static getWorldPosition(box: AbstractMesh): Vector3 {
        const matrix = box.computeWorldMatrix(true);
        const local = new Vector3(0, 0, 0);
        return Vector3.TransformCoordinates(local, matrix);
    }
}

class Dice {
    public static model: AbstractMesh;
    public static staticY: number;
    public static readonly SIZE = 0.5;
    private static readonly MODEL_SIZE = 0.005875;
    private static readonly STATIC_Y_ERROR: number = 0.01;
    private static readonly MODEL_SCALE = Dice.SIZE / Dice.MODEL_SIZE;
    private static readonly SIDES_POINT = [
        {pos: new Vector3(Dice.SIZE / 2, 0, 0,), point: 4},
        {pos: new Vector3(-Dice.SIZE / 2, 0, 0,), point: 3},
        {pos: new Vector3(0, Dice.SIZE / 2, 0,), point: 5},
        {pos: new Vector3(0, -Dice.SIZE / 2, 0,), point: 1},
        {pos: new Vector3(0, 0, Dice.SIZE / 2,), point: 2},
        {pos: new Vector3(0, 0, -Dice.SIZE / 2,), point: 6},
    ];
    private readonly mesh: Mesh;
    private sides: { mesh: Mesh, point: number, }[];

    constructor(pos: Vector3) {
        let model = Dice.model.clone("", null);
        model.scaling = new Vector3(Dice.MODEL_SCALE, Dice.MODEL_SCALE, Dice.MODEL_SCALE);

        let collider = Mesh.CreateBox("", Dice.SIZE);
        collider.isVisible = false;

        this.sides = Dice.SIDES_POINT.map(({pos, point}) => {
            let mesh = Mesh.CreateBox("", 0);
            mesh.position = pos;
            mesh.isVisible = false;
            return {mesh, point};
        });

        this.mesh = new Mesh("");
        this.mesh.addChild(model);
        this.mesh.addChild(collider);
        this.sides.forEach(side => this.mesh.addChild(side.mesh));

        this.mesh.position = pos;

        collider.physicsImpostor = new PhysicsImpostor(collider, PhysicsImpostor.BoxImpostor, {mass: 0});
        this.mesh.physicsImpostor = new PhysicsImpostor(this.mesh, PhysicsImpostor.NoImpostor, {
            mass: 1,
            friction: Main.friction,
            restitution: Main.restitution
        });
    }

    public get isDynamic(): boolean {
        return this.mesh.position.y > Dice.staticY + Dice.STATIC_Y_ERROR
            || this.mesh.position.y < Dice.staticY - Dice.STATIC_Y_ERROR;
    }

    public get point(): number {
        return this.sides.sort((a, b) => Util.getWorldPosition(b.mesh).y - Util.getWorldPosition(a.mesh).y)[0].point;
    }

    public destroy() {
        this.mesh.dispose();
    }
}

class Cup {
    public static readonly height = 3;
    public static readonly thickness = 0.2;
    private readonly scene: Scene;
    private readonly diameter = 3;
    private readonly tessellation = 8;
    private readonly percent = 1;
    private mesh: Mesh;
    private holder: Mesh;
    private joint: HingeJoint;

    constructor(scene: Scene) {
        this.scene = scene;
        this.mesh = this.createCup();
        this.createHingeJoint();
    }

    public destroy() {
        this.holder.dispose();
        this.mesh.dispose();
    }

    public setMotor(v) {
        this.joint.setMotor(v, 1000);
    }

    public getEulerAngles() {
        return this.mesh.rotationQuaternion.toEulerAngles();
    }

    private createCup() {
        let opacityMaterial = new StandardMaterial("", this.scene);
        opacityMaterial.opacityTexture = new Texture("bg.png", null);

        let top = this.createThickness();
        top.material = opacityMaterial;

        let bottom = this.createThickness();
        bottom.position.y = -Cup.height - Cup.thickness;

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
            friction: Main.friction,
            restitution: Main.restitution,
        });
        bottom.physicsImpostor = new PhysicsImpostor(bottom, PhysicsImpostor.CylinderImpostor, {
            mass: 0,
            friction: Main.friction,
            restitution: Main.restitution,
        });
        sides.forEach(side => side.physicsImpostor = new PhysicsImpostor(side, PhysicsImpostor.BoxImpostor, {
            mass: 0,
            friction: Main.friction,
            restitution: Main.restitution,
        }));
        cup.physicsImpostor = new PhysicsImpostor(cup, PhysicsImpostor.NoImpostor, {
            mass: 1,
            friction: Main.friction,
            restitution: Main.restitution,
        });

        return cup;
    }

    private createThickness() {
        return MeshBuilder.CreateCylinder("", {
            diameter: this.diameter,
            height: Cup.thickness,
            tessellation: this.tessellation,
        });
    }

    private createSide(i) {
        let radian = Math.PI / this.tessellation;
        let width = this.diameter / 2 * Math.sin(radian) * 2;
        let side = MeshBuilder.CreateBox("", {
            width: width,
            height: Cup.height,
            depth: Cup.thickness,
        });
        let rotation = radian + radian * 2 * i;
        let innerRadius = this.diameter / 2 * Math.cos(radian) + Cup.thickness / 2;
        side.rotationQuaternion = Quaternion.RotationAxis(new Vector3(0, 1, 0), rotation);
        side.position.x = innerRadius * Math.sin(rotation);
        side.position.y = -(Cup.height + Cup.thickness) / 2;
        side.position.z = innerRadius * Math.cos(rotation);
        return side;
    }

    private createHingeJoint() {
        this.holder = MeshBuilder.CreateSphere("", {diameter: 0, segments: 4});
        this.holder.isVisible = false;
        this.holder.physicsImpostor = new PhysicsImpostor(this.holder, PhysicsImpostor.SphereImpostor, {mass: 0});
        this.joint = new HingeJoint({
            mainPivot: new Vector3(0, 0, 0),
            connectedPivot: new Vector3(0, 0, 0),
            mainAxis: new Vector3(0, 0, -1,),
            connectedAxis: new Vector3(0, 0, -1,),
            nativeParams: {}
        });
        this.holder.physicsImpostor.addJoint(this.mesh.physicsImpostor, this.joint);
    }
}

class GUI {
    private background: AdvancedDynamicTexture;
    private foreground: AdvancedDynamicTexture;

    constructor() {
        this.background = AdvancedDynamicTexture.CreateFullscreenUI("", false);
        this.foreground = AdvancedDynamicTexture.CreateFullscreenUI("", true);
        const bg = new Image("", "assets/image/bg.jpg");
        this.background.addControl(bg);
        this.createButton("assets/image/return.png", this.onClickReturnButton.bind(this));
        this.createButton("assets/image/help.png", this.onClickHelpButton.bind(this));
        this.createButton("assets/image/setting.png", this.onClickSettingButton.bind(this));
        const frame = new Image("", "assets/image/frame.png");
        frame.autoScale = true;
        frame.stretch = Image.STRETCH_NONE;
        this.foreground.addControl(frame);
        const xmlLoader = new XmlLoader();
        xmlLoader.loadLayout("ui.xml", this.foreground, null);
    }

    private createButton(path: string, callback: (eventData: any, eventState: EventState) => void) {
        const button = Button.CreateImageOnlyButton("", path);
        button.onPointerUpObservable.add(callback);
        button.image.autoScale = true;
        button.image.stretch = Image.STRETCH_EXTEND;
        button.thickness = 0;
        this.foreground.addControl(button);
    }

    private onClickReturnButton() {

    }

    private onClickHelpButton() {

    }

    private onClickSettingButton() {

    }
}

class Main {
    public static readonly restitution = 0.1;
    public static readonly friction = 0.1;
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
    private scene: Scene;
    private camera: FreeCamera;
    private gui: GUI;
    private cup: Cup;
    private dices: Dice[];
    private shakeList: [number, number | undefined][];
    private frame = 0;
    private targetVector3 = Vector3.Zero();
    private cameraPosition = new Vector3(11, 11, 7);

    constructor() {
        this.createScene();
        this.gui = new GUI();
        this.shakeList = this.createShakeList.map(([frame, creator]) => [frame, creator && creator()]);
        this.loadDiceMesh(() => {
            this.start();
        });
    }

    private createScene() {
        let canvas = document.getElementById("canvas") as HTMLCanvasElement;
        let engine = new Engine(canvas, true);
        this.scene = new Scene(engine);
        const cannonJSPlugin = new CannonJSPlugin(false, 1000);
        this.scene.enablePhysics(undefined, cannonJSPlugin);
        this.camera = new FreeCamera("", this.cameraPosition, this.scene);
        this.camera.setTarget(this.targetVector3);
        this.camera.attachControl(canvas, true);
        new HemisphericLight("", new Vector3(0, 1, 0), this.scene);
        engine.runRenderLoop(() => {
            this.scene.render();
            this.onFrame();
        });
        window.addEventListener("resize", () => {
            engine.resize();
        });
    }

    private loadDiceMesh(callback: CallableFunction) {
        SceneLoader.ImportMesh("",
            "./assets/gltf/touzi/",
            "touzi.gltf",
            this.scene,
            (newMeshes) => {
                Dice.model = newMeshes[0];
                callback();
            }
        );
    }

    private createDices() {
        Dice.staticY = Dice.SIZE / 2 - (Cup.height + Cup.thickness / 2);
        let centerDistance = 0.75;
        return [
            new Vector3(0, Dice.staticY, 0),
            new Vector3(centerDistance, Dice.staticY, 0),
            new Vector3(-centerDistance, Dice.staticY, 0),
            new Vector3(0, Dice.staticY, centerDistance),
            new Vector3(0, Dice.staticY, -centerDistance),
        ].map(pos => new Dice(pos));
    }

    private start() {
        this.frame = 0;
        this.cup = new Cup(this.scene);
        this.dices = this.createDices();
    }

    private end() {
        this.dices.forEach(dice => dice.destroy());
        this.cup.destroy();
        this.dices = undefined;
    }

    private onFrame() {
        if (this.cup === undefined) {
            return;
        }
        this.frame++;
        if (this.dices === undefined) {
            if (this.frame > 200) {
                this.start();
            }
            return;
        }
        let flag = false;
        for (let i = 0; i < this.shakeList.length; i++) {
            let shake = this.shakeList[i];
            if (this.frame < shake[0]) {
                flag = true;
                if (shake[1]) {
                    this.cup.setMotor(shake[1]);
                } else {
                    let a = this.cup.getEulerAngles();
                    let time = (shake[0] - this.frame) / 60;
                    let v = -a.z / time;
                    this.cup.setMotor(v);
                }
                break;
            }
        }
        if (!flag) {
            this.cup.setMotor(0);
            if (!this.dices.some(dice => dice.isDynamic)) {
                // console.log(this.dices.map(dice => dice.point).sort());
            }
        }
        if (this.frame > 180) {
            this.end();
        }
    }
}

new Main();
