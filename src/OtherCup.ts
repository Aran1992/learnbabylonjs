import {AbstractMesh, Mesh, MeshBuilder, Quaternion, Vector3} from "babylonjs";
import Config from "./Config";
import OtherDice from "./OtherDice";

export default class OtherCup {
    private readonly cup: Mesh;
    private dices: OtherDice[];

    constructor(position: Vector3, diceModelTemplate: AbstractMesh) {
        this.cup = this.createCup(position);
        this.dices = this.createDices(diceModelTemplate, position);
    }

    public roll() {
    }

    private createCup(position: Vector3) {
        const top = this.createThickness();

        const sides = [];
        for (let i = 0; i < Config.cup.tessellation; i++) {
            const side = this.createSide(i);
            sides.push(side);
        }

        const cup = new Mesh("");
        cup.addChild(top);
        sides.forEach(side => cup.addChild(side));

        cup.position = position;

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

    private createDices(diceModelTemplate: AbstractMesh, cupPos: Vector3) {
        const y = -(Config.cup.height + Config.cup.thickness / 2 - Config.dice.size / 2);
        return Config.cup.dices.map(dicePos => {
            const position = cupPos.add(new Vector3(dicePos[0], y, dicePos[1]));
            return new OtherDice(diceModelTemplate, position);
        });
    }
}
