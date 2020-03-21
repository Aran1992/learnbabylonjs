import {CannonJSPlugin, Engine, FreeCamera, HemisphericLight, Scene, Vector3} from "babylonjs";
import PhysicalCup from "./PhysicalCup";
import Config from "./Config";

function fake_click(obj) {
    var ev = document.createEvent("MouseEvents");
    ev.initMouseEvent(
        "click", true, false, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null
    );
    obj.dispatchEvent(ev);
}

function download(name, data) {
    var urlObject = window.URL || window.webkitURL || window;

    var downloadData = new Blob([data]);

    var save_link = document.createElementNS("http://www.w3.org/1999/xhtml", "a")
    save_link.href = urlObject.createObjectURL(downloadData);
    save_link.download = name;
    fake_click(save_link);
}

class CreateScene {
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
    private times = 0;

    constructor() {
        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        const engine = new Engine(canvas, true, null, true);
        this.scene = new Scene(engine);
        const cannonJSPlugin = new CannonJSPlugin(false);
        this.scene.enablePhysics(null, cannonJSPlugin);
        const [x, y, z] = Config.camera.pos;
        const camera = new FreeCamera("", new Vector3(x, y, z), this.scene);
        const [tx, ty, tz] = Config.camera.target;
        camera.setTarget(new Vector3(tx, ty, tz));
        // 不知道为啥默认旋转角度不是0 需要转回来
        camera.rotation.y = 0;
        // camera.attachControl(canvas);
        new HemisphericLight("", new Vector3(1, 1, -1), this.scene);
        engine.runRenderLoop(() => {
            this.scene.render();
        });
        setTimeout(() => {
            this.start();
        }, 1000);
    }

    private start() {
        const result = [];
        const start = new Date().getTime();
        const totalCount = 2;
        let completeCount = totalCount;
        for (let i = 0; i < totalCount; i++) {
            const cup = new PhysicalCup(new Vector3(0, 0, i * 200), this.scene);
            // const args = this.createShakeList.map(([frame, creator]) => [frame, creator && creator()]);
            const args = //1,4,4,5,6
                [[10, -5.682770889356593], [20, 5.261282736873518], [30, -4.521011282358746], [40, 4.501058969542266], [50, -2.061774020530656], [60, 2.339427333998123], [70, -0.5115494559287483], [80, 0.2445071835686432], [90, null]];
            cup.roll(args, (point) => {
                if (point) {
                    result[point] = result[point] || [];
                    result[point].push(args);
                }
                cup.dispose();
                completeCount--;
                if (completeCount === 0) {
                    console.log(result);
                    console.log(JSON.stringify(result));
                    for (let key in result) {
                        if (result.hasOwnProperty(key)) {
                            console.log(`//${key}
this.shakeList = ${JSON.stringify(result[key][i])}`);
                        }
                    }
                    const end = new Date().getTime();
                    this.times++;
                    console.log("this.times", this.times);
                    console.log("end - start", end - start);
                    setTimeout(() => {
                        this.start();
                    }, 1000);
                }
            });
        }
    }
}

new CreateScene();
