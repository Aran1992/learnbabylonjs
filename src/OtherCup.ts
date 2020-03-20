import {AbstractMesh, Mesh, MeshBuilder, Quaternion, Scene, Vector3} from "babylonjs";
import Config from "./Config";
import OtherDice from "./OtherDice";

export default class OtherCup {
    private scene: Scene;
    private readonly cup: Mesh;
    private dices: OtherDice[];
    private frame = 0;
    private readonly createShakeList: [number, () => number | undefined][] = [
        [10, () => -5 - Math.random()],
        [20, () => 5 + Math.random()],
        [30, () => -4 - Math.random()],
        [40, () => 4 + Math.random()],
        [50, () => -2 - Math.random()],
        [60, () => 2 + Math.random()],
        [70, () => -1 * Math.random()],
        [80, () => 1 * Math.random()],
        [90, undefined],
    ];
    private shakeList: [number, number | undefined][];

    constructor(scene: Scene, position: Vector3, diceModelTemplate: AbstractMesh, cupModelTemplate: AbstractMesh) {
        this.scene = scene;
        this.cup = this.createCup(position, cupModelTemplate);
        this.dices = this.createDices(diceModelTemplate, position);
        this.scene.registerBeforeRender(this.onFrame.bind(this));
    }

    public roll() {
        this.shakeList = this.createShakeList.map(([frame, creator]) => [frame, creator && (creator() * 0.01)]);
    }

    public eliminate(befDice: number[], removeDice: number[]) {
    }

    private createCup(position: Vector3, cupModelTemplate: AbstractMesh) {
        const model = cupModelTemplate.clone("", null);
        model.scaling = new Vector3(Config.cup.scale, Config.cup.scale, Config.cup.scale);
        const [x, y, z] = Config.cup.position;
        model.position = new Vector3(x, y, z);

        const cup = new Mesh("");
        cup.addChild(model);

        cup.position = position;

        return cup;
    }

    private createDices(diceModelTemplate: AbstractMesh, cupPos: Vector3) {
        const y = -(Config.cup.height + Config.cup.thickness / 2 - Config.dice.size / 2);
        return Config.cup.dices[5].map(dicePos => {
            const position = cupPos.add(new Vector3(dicePos[0], y, dicePos[1]));
            return new OtherDice(diceModelTemplate, position);
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
                        this.cup.rotation.z += shake[1];
                    } else {
                        let time = shake[0] - this.frame;
                        let v = -this.cup.rotation.z / time;
                        this.cup.rotation.z += v;
                    }
                    break;
                }
            }
            if (!flag) {
                this.cup.rotation.z = 0;
            }
            this.frame++;
        } else {
            this.cup.rotation.z = 0;
        }
    }
}
