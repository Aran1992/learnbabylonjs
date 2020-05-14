import {AbstractMesh, Mesh, Quaternion, Scene, Vector3} from "babylonjs";
import Config from "./Config";
import Dice from "./Dice";

export default class Cup {
    private scene: Scene;
    private position: Vector3;
    private cup: Mesh;
    private dices: Dice[];
    private frame;
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
    private rollResult: number[];
    private removeDices: number[];
    private points: number[];

    constructor(
        scene: Scene,
        position: Vector3,
        diceModelTemplate: AbstractMesh,
        cupModelTemplate: AbstractMesh
    ) {
        this.scene = scene;
        this.position = position.clone();
        this.cup = this.createCup(cupModelTemplate, position.clone());
        this.cup.setEnabled(false);
        this.dices = this.createDices(diceModelTemplate, position.clone());
        this.dices.forEach(dice => dice.setEnabled(false));
        this.points = [];
        for (let i = 0; i < Config.cup.initCount; i++) {
            this.points.push(Config.dice.sides[0].point);
        }
    }

    public show() {
        this.points = [];
        for (let i = 0; i < Config.cup.initCount; i++) {
            this.points.push(Config.dice.sides[0].point);
        }
        this.refresh();
    }

    public showPoints(points: number[]) {
        this.points = points;
        this.refresh();
    }

    public showCount(diceCount: number) {
        this.points = [];
        for (let i = 0; i < diceCount; i++) {
            this.points.push(Config.dice.sides[0].point);
        }
        this.refresh();
    }

    public showResult(points: number[]) {
        this.points = points;
        this.refresh();
        this.cup.setEnabled(false);
    }

    public hide() {
        this.scene.unregisterBeforeRender(this.onRollFrame);
        this.cup.setEnabled(false);
        this.dices.forEach(dice => dice.setEnabled(false));
    }

    public roll(points: number[]) {
        this.refresh();

        this.rollResult = points;

        this.shakeList = this.createShakeList.map(([frame, creator]) => [frame, creator && (creator() * 0.01)]);
        this.frame = 0;
        this.scene.registerBeforeRender(this.onRollFrame);
    }

    public eliminate(befDices: number[], removeDices: number[]) {
        this.points = befDices;
        this.refresh();
        this.removeDices = removeDices;
        this.frame = 0;
        this.scene.registerBeforeRender(this.onEliminateFrame);
    }

    private createCup(cupModelTemplate: AbstractMesh, position: Vector3): Mesh {
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
        return Config.cup.dices[Config.cup.initCount].map((dicePos, i) => {
            const position = cupPos.add(new Vector3(dicePos[0], y, dicePos[1]));
            return new Dice(this.scene, diceModelTemplate, position);
        });
    }

    private refresh() {
        this.scene.unregisterBeforeRender(this.onRollFrame);

        this.scene.unregisterBeforeRender(this.onEliminateFrame);

        this.cup.setEnabled(true);
        this.cup.position = this.position.clone();
        this.cup.rotationQuaternion = new Quaternion();
        this.setVisibility(1);

        const y = -(Config.cup.height + Config.cup.thickness / 2 - Config.dice.size / 2);
        const positions = Config.cup.dices[this.points.length];
        this.dices.forEach((dice, i) => {
            dice.setVisibility(1);
            const position = positions[i];
            if (position) {
                dice.setEnabled(true);
                dice.position = this.position.add(new Vector3(position[0], y, position[1]));
                dice.point = this.points[i];
            } else {
                dice.setEnabled(false);
            }
        });
    }

    private onRollFrame = () => {
        if (this.shakeList) {
            let flag = false;
            for (let i = 0; i < this.shakeList.length; i++) {
                let shake = this.shakeList[i];
                if (this.frame < shake[0]) {
                    flag = true;
                    if (shake[1]) {
                        this.cup.addRotation(0, 0, shake[1]);
                    } else {
                        let time = shake[0] - this.frame;
                        let v = -this.cup.rotationQuaternion.toEulerAngles().z / time;
                        this.cup.addRotation(0, 0, v);
                    }
                    break;
                }
            }
            if (!flag) {
                this.cup.rotationQuaternion.set(0, 0, 0, 0);
            }
            if (this.frame >= Config.rollAnimationDuration / 1000 * Config.fps) {
                this.scene.unregisterBeforeRender(this.onRollFrame);

                this.points = this.rollResult;
                this.refresh();
            }
            this.frame++;
        } else {
            this.cup.rotationQuaternion.set(0, 0, 0, 0);
        }
    }

    private onEliminateFrame = () => {
        const base = 30;
        const delta = 1 / base;
        if (this.frame < base) {
            this.setVisibility(this.getVisibility() - delta);
        } else if (this.frame < base * 2) {
            this.dices.forEach((dice, i) => {
                if (this.removeDices.indexOf(dice.point) !== -1) {
                    dice.setVisibility(dice.getVisibility() - delta);
                }
            });
        } else if (this.frame < base * 3) {
            this.dices.forEach((dice, i) => {
                if (this.removeDices.indexOf(dice.point) !== -1) {
                    dice.setVisibility(dice.getVisibility() + delta);
                }
            });
        } else if (this.frame < base * 4) {
            this.dices.forEach((dice, i) => {
                if (this.removeDices.indexOf(dice.point) !== -1) {
                    dice.setVisibility(dice.getVisibility() - delta);
                }
            });
        } else if (this.frame < base * 5) {
            this.dices.forEach((dice, i) => {
                if (this.removeDices.indexOf(dice.point) !== -1) {
                    dice.setVisibility(dice.getVisibility() + delta);
                }
            });
        } else if (this.frame < base * 6) {
            this.dices.forEach((dice, i) => {
                if (this.removeDices.indexOf(dice.point) !== -1) {
                    dice.setVisibility(dice.getVisibility() - delta);
                }
            });
        }
        this.frame++;
    }

    private getMesh() {
        return this.cup.getChildMeshes()[1];
    }

    private getVisibility() {
        return this.getMesh().visibility;
    }

    private setVisibility(visibility: number) {
        if (visibility < 0) {
            visibility = 0;
        } else if (visibility > 1) {
            visibility = 1;
        }
        this.getMesh().visibility = visibility;
    }
}
