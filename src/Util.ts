import {AbstractMesh, Vector3} from "babylonjs";
import SoundMgr from "./SoundMgr";
import Config from "./Config";

export default class Util {
    public static getWorldPosition(box: AbstractMesh): Vector3 {
        const matrix = box.computeWorldMatrix(true);
        const local = new Vector3(0, 0, 0);
        return Vector3.TransformCoordinates(local, matrix);
    }

    public static removeItemFromArray(array, item) {
        let index = array.findIndex(item_ => item === item_);
        if (index !== -1) {
            array.splice(index, 1);
        }
    }

    public static values(json) {
        const arr = [];
        for (let key in json) {
            if (json.hasOwnProperty(key)) {
                arr.push(json[key]);
            }
        }
        return arr;
    }

    public static onClick(button, callback, option?) {
        option = option || {};
        if (option.playSound === undefined) {
            option.playSound = true;
        }
        button.onPointerUpObservable.add(() => {
            if (option.playSound) {
                SoundMgr.playSound(Config.audioResTable.click);
            }
            callback();
        });
    }
}
