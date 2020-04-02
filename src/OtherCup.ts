import {AbstractMesh, Mesh, Scene, Vector3} from "babylonjs";
import Config from "./Config";
import OtherDice from "./OtherDice";

export default class OtherCup {
    private scene: Scene;
    private position: Vector3;
    private diceModelTemplate: AbstractMesh;
    private cupModelTemplate: AbstractMesh;
    private cup: Mesh;
    private dices: OtherDice[];
    private frame;
    private onFrameHandler;
    private shakeList: [number, number | undefined][];
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

    constructor(scene: Scene, position: Vector3, diceModelTemplate: AbstractMesh, cupModelTemplate: AbstractMesh) {
        this.scene = scene;
        this.position = position;
        this.diceModelTemplate = diceModelTemplate;
        this.cupModelTemplate = cupModelTemplate;
        this.cup = this.createCup(this.position, this.cupModelTemplate);
    }

    public dispose() {
        if (this.cup) {
            this.cup.dispose();
        }
        if (this.dices) {
            this.dices.forEach(dice => dice.dispose());
        }
    }

    public reset() {
        this.clear();
        this.cup = this.createCup(this.position, this.cupModelTemplate);
    }

    public roll() {
        this.clear();
        this.cup = this.createCup(this.position, this.cupModelTemplate);
        this.shakeList = this.createShakeList.map(([frame, creator]) => [frame, creator && (creator() * 0.01)]);
        this.frame = 0;
        this.onFrameHandler = this.onFrame.bind(this);
        this.scene.registerBeforeRender(this.onFrameHandler);
    }

    public eliminate(befDice: number[], removeDices: number[], callback?: CallableFunction) {
        this.dices = this.createDices(befDice, this.diceModelTemplate, this.position);
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
        if (this.dices) {
            this.dices.forEach(dice => dice.dispose());
            this.dices = [];
        }
    }

    private playOpen(callback: CallableFunction) {
        const frameHandler = () => {
            const mesh = this.cup.getChildMeshes()[0].getChildMeshes()[0];
            mesh.visibility -= 1 / 60;
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
        if (count === 0) {
            callback();
        }
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

    private createDices(befDice: number[], diceModelTemplate: AbstractMesh, cupPos: Vector3) {
        const y = -(Config.cup.height + Config.cup.thickness / 2 - Config.dice.size / 2);
        return Config.cup.dices[befDice.length].map((dicePos, i) => {
            const position = cupPos.add(new Vector3(dicePos[0], y, dicePos[1]));
            return new OtherDice(this.scene, diceModelTemplate, position, befDice[i]);
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
