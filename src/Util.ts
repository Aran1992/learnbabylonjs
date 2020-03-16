import {AbstractMesh, Vector3} from "babylonjs";

export default class Util {
    public static getWorldPosition(box: AbstractMesh): Vector3 {
        const matrix = box.computeWorldMatrix(true);
        const local = new Vector3(0, 0, 0);
        return Vector3.TransformCoordinates(local, matrix);
    }
}