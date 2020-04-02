import {Image} from "babylonjs-gui/2D/controls/image";
import Config from "./Config";
import {StackPanel} from "babylonjs-gui/2D/controls/stackPanel";

export default class DicePanel {
    private diceStackPanel: StackPanel;

    constructor(diceStackPanel: StackPanel) {
        this.diceStackPanel = diceStackPanel;
    }

    public get isVisible(): boolean {
        return this.diceStackPanel.isVisible;
    }

    public set isVisible(visible: boolean) {
        this.diceStackPanel.isVisible = visible;
    }

    public refresh(points: number[]) {
        this.diceStackPanel.children.forEach((child: Image, i) => {
            if (points[i] !== undefined) {
                child.isVisible = true;
                child.source = Config.pointImagePath.replace("${point}", points[i].toString());
            } else {
                child.isVisible = false;
            }
        });
    }
}
