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
import {AdvancedDynamicTexture, Image, XmlLoader} from "babylonjs-gui";

class Util {
    public static getWorldPosition(box: AbstractMesh): Vector3 {
        const matrix = box.computeWorldMatrix(true);
        const local = new Vector3(0, 0, 0);
        return Vector3.TransformCoordinates(local, matrix);
    }
}

class Cup {
    public static readonly HEIGHT = 3;
    public static readonly THICKNESS = 0.2;
    private readonly scene: Scene;
    private readonly diameter = 3;
    private readonly tessellation = 8;
    private readonly percent = 1;
    private mesh: Mesh;
    private holder: Mesh;
    private joint: HingeJoint;
    private dices: PhysicalDice[];

    constructor(scene: Scene, camera: FreeCamera, position: Vector3) {
        this.scene = scene;
        this.mesh = this.createCup(position, camera);
        this.createHingeJoint(position);
        this.dices = this.createDices(position);
    }

    public destroy() {
        this.holder.dispose();
        this.mesh.dispose();
        this.dices.forEach(dice => dice.destroy());
    }

    public setMotor(v) {
        this.joint.setMotor(v, 1000);
    }

    public getEulerAngles() {
        return this.mesh.rotationQuaternion.toEulerAngles();
    }

    public isDynamic() {
        return this.dices.some(dice => dice.isDynamic);
    }

    public getPoints() {
        return this.dices.map(dice => dice.point).sort();
    }

    public getDetailPoints() {
        return this.dices.map(dice => ({
            position: dice.position.clone(),
            rotationQuaternion: dice.rotationQuaternion.clone()
        }));
    }

    private createHingeJoint(position: Vector3) {
        this.holder = MeshBuilder.CreateSphere("", {diameter: 0, segments: 4});
        this.holder.position = position;
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

    private createDices(position: Vector3) {
        return PhysicalDice.DICE_POS_LIST.map(pos => new PhysicalDice(pos.add(position)));
    }
}

class PhysicalDice {
    public static model: AbstractMesh;
    public static readonly SIZE = 0.5;
    public static readonly STATIC_Y = PhysicalDice.SIZE / 2 - (Cup.HEIGHT + Cup.THICKNESS / 2);
    public static readonly CENTER_DISTANCE = 0.75;
    public static readonly DICE_POS_LIST = [
        new Vector3(0, PhysicalDice.STATIC_Y, 0),
        new Vector3(PhysicalDice.CENTER_DISTANCE, PhysicalDice.STATIC_Y, 0),
        new Vector3(-PhysicalDice.CENTER_DISTANCE, PhysicalDice.STATIC_Y, 0),
        new Vector3(0, PhysicalDice.STATIC_Y, PhysicalDice.CENTER_DISTANCE),
        new Vector3(0, PhysicalDice.STATIC_Y, -PhysicalDice.CENTER_DISTANCE),
    ];
    private static readonly MODEL_SIZE = 0.005875;
    public static readonly MODEL_SCALE = PhysicalDice.SIZE / PhysicalDice.MODEL_SIZE;
    private static readonly STATIC_Y_ERROR: number = 0.01;
    private static readonly SIDES_POINT = [
        {pos: new Vector3(PhysicalDice.SIZE / 2, 0, 0,), point: 4},
        {pos: new Vector3(-PhysicalDice.SIZE / 2, 0, 0,), point: 3},
        {pos: new Vector3(0, PhysicalDice.SIZE / 2, 0,), point: 5},
        {pos: new Vector3(0, -PhysicalDice.SIZE / 2, 0,), point: 1},
        {pos: new Vector3(0, 0, PhysicalDice.SIZE / 2,), point: 2},
        {pos: new Vector3(0, 0, -PhysicalDice.SIZE / 2,), point: 6},
    ];
    private readonly mesh: Mesh;
    private sides: { mesh: Mesh, point: number, }[];

    constructor(pos: Vector3) {
        let model = PhysicalDice.model.clone("", null);
        model.scaling = new Vector3(PhysicalDice.MODEL_SCALE, PhysicalDice.MODEL_SCALE, PhysicalDice.MODEL_SCALE);

        let collider = Mesh.CreateBox("", PhysicalDice.SIZE);
        collider.isVisible = false;

        this.sides = PhysicalDice.SIDES_POINT.map(({pos, point}) => {
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
        return this.mesh.position.y > PhysicalDice.STATIC_Y + PhysicalDice.STATIC_Y_ERROR
            || this.mesh.position.y < PhysicalDice.STATIC_Y - PhysicalDice.STATIC_Y_ERROR;
    }

    public get point(): number {
        return this.sides.sort((a, b) => Util.getWorldPosition(b.mesh).y - Util.getWorldPosition(a.mesh).y)[0].point;
    }

    public get position() {
        return this.mesh.position;
    }

    public get rotationQuaternion() {
        return this.mesh.rotationQuaternion;
    }

    public destroy() {
        this.mesh.dispose();
    }
}

class Dice {
    private mesh: AbstractMesh;
    private readonly originPosition: Vector3;

    constructor(position: Vector3) {
        let model = PhysicalDice.model.clone("", null);
        model.scaling = new Vector3(PhysicalDice.MODEL_SCALE, PhysicalDice.MODEL_SCALE, PhysicalDice.MODEL_SCALE);

        this.mesh = new Mesh("");
        this.mesh.addChild(model);

        this.originPosition = position.clone();
        this.mesh.position = this.originPosition.clone();
    }

    public setPoint(position: Vector3, rotationQuaternion: Quaternion) {
        this.mesh.position = position.add(this.originPosition);
        this.mesh.rotationQuaternion = rotationQuaternion;
    }
}

class GUI {
    private readonly canvas: HTMLCanvasElement;
    private readonly background: AdvancedDynamicTexture;
    private readonly foreground: AdvancedDynamicTexture;
    private designWidth = 1280;
    private designHeight = 720;
    private renderScale = 1;
    private xmlLoader: XmlLoader;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.calcRenderScale();
        this.background = AdvancedDynamicTexture.CreateFullscreenUI("", false);
        this.background.renderScale = this.renderScale;
        this.foreground = AdvancedDynamicTexture.CreateFullscreenUI("", true);
        this.foreground.renderScale = this.renderScale;
        this.createImage("assets/image/bg.jpg", this.background);
        this.xmlLoader = new XmlLoader();
        this.xmlLoader.loadLayout("ui.xml", this.foreground, () => {
            this.onClick(this.xmlLoader.getNodeById("returnButton"), this.onClickReturnButton.bind(this));
            this.onClick(this.xmlLoader.getNodeById("settingButton"), this.onClickSettingButton.bind(this));
            this.onClick(this.xmlLoader.getNodeById("helpButton"), this.onClickHelpButton.bind(this));
        });
    }

    private createImage(path, parent) {
        const bg = new Image("", path);
        bg.autoScale = true;
        bg.stretch = Image.STRETCH_NONE;
        (parent || this.foreground).addControl(bg);
    }

    private calcRenderScale() {
        if (this.canvas.width / this.canvas.height > this.designWidth / this.designHeight) {
            this.renderScale = this.designHeight / this.canvas.height;
        } else {
            this.renderScale = this.designWidth / this.canvas.width;
        }
    }

    private onClick(button, callback) {
        button.onPointerUpObservable.add(callback);
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
    private readonly canvas: HTMLCanvasElement;
    private scene: Scene;
    private camera: FreeCamera;
    private gui: GUI;
    private cups: Cup[];
    private shakeList: [number, number | undefined][];
    private frame = 0;
    private targetVector3 = Vector3.Zero();
    private cameraPosition = new Vector3(11, 11, 7);
    private width = 10;
    private height1 = 5;
    private height2 = 3;
    private height3 = -3;
    private cupPosList = [
        new Vector3(0, 0, -this.height1),
        new Vector3(0, 0, this.height1),
        new Vector3(this.width, 0, this.height2),
        new Vector3(-this.width, 0, this.height2),
        new Vector3(this.width, 0, this.height3),
        new Vector3(-this.width, 0, this.height3),
    ];
    private virtualCups: Dice[][];

    constructor() {
        this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
        this.createScene();
        this.gui = new GUI(this.canvas);
        this.shakeList = this.createShakeList.map(([frame, creator]) => [frame, creator && creator()]);
        this.loadDiceMesh(() => {
            this.virtualCups = this.cupPosList.map(cupPos => {
                return PhysicalDice.DICE_POS_LIST.map(dicePos => {
                    return new Dice(cupPos)
                });
            });
            this.start();
        });
    }

    private createScene() {
        let engine = new Engine(this.canvas, true);
        this.scene = new Scene(engine);
        const cannonJSPlugin = new CannonJSPlugin(false, 1000);
        this.scene.enablePhysics(undefined, cannonJSPlugin);
        this.camera = new FreeCamera("", this.cameraPosition, this.scene);
        this.camera.setTarget(this.targetVector3);
        this.camera.attachControl(this.canvas, true);
        new HemisphericLight("", new Vector3(0, 1, 0), this.scene);
        engine.runRenderLoop(() => {
            this.scene.render();
        });
        this.scene.registerBeforeRender(this.onFrame.bind(this));
    }

    private loadDiceMesh(callback: CallableFunction) {
        SceneLoader.ImportMesh("",
            "./assets/gltf/touzi/",
            "touzi.gltf",
            this.scene,
            (newMeshes) => {
                PhysicalDice.model = newMeshes[0];
                callback();
            }
        );
    }

    private start() {
        this.frame = 0;
        this.cups = [new Cup(this.scene, this.camera, Vector3.Zero())];
    }

    private end() {
        this.cups.forEach(cup => cup.destroy());
    }

    private onFrame() {
        if (this.cups === undefined) {
            return;
        }
        this.frame++;
        if (this.frame > 241) {
            if (this.frame > 300) {
                this.start();
            }
            return;
        }
        const detailPoints = this.cups[0].getDetailPoints();
        this.virtualCups.forEach(dices => dices.forEach((dice, i) => dice.setPoint(detailPoints[i].position, detailPoints[i].rotationQuaternion)));
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
        if (this.frame > 240) {
            this.end();
        }
    }
}

new Main();
