import {XmlLoader} from "babylonjs-gui/2D/xmlLoader";
import {Rectangle} from "babylonjs-gui/2D/controls/rectangle";
import {Image} from "babylonjs-gui";
import Config from "./Config";

export default class CallResultPanel {
    private xmlLoader: XmlLoader;
    private root: Rectangle;
    private left: Rectangle;
    private right: Rectangle;

    constructor(xmlLoader: XmlLoader) {
        this.xmlLoader = xmlLoader;
        this.root = this.xmlLoader.getNodeById("showRect");
        this.left = this.root.getChildByName("left") as Rectangle;
        this.right = this.root.getChildByName("right") as Rectangle;

        this.root.isVisible = false;
    }

    show(index: number, points: number[]) {
        this.root.isVisible = true;
        const allPlayerInfoPanel = this.xmlLoader.getNodeById(`allPlayerInfoPanel`) as Rectangle;
        const playerInfoPanel = allPlayerInfoPanel.children[index];
        const panelLeft = parseInt(playerInfoPanel.left as string);
        const panelTop = parseInt(playerInfoPanel.top as string);
        let isLeft = true;
        let top = panelTop - 60;
        let left = panelLeft + 180;
        switch (index) {
            case 0: {
                top = panelTop - 80;
                left = panelLeft + 220;
                break;
            }
            case 1:
            case 2: {
                isLeft = false;
                left = panelLeft - 180;
                break;
            }
        }
        this.root.top = top;
        this.root.left = left;
        let panel;
        if (isLeft) {
            this.left.isVisible = true;
            this.right.isVisible = false;
            panel = this.left;
        } else {
            this.left.isVisible = false;
            this.right.isVisible = true;
            panel = this.right;
        }
        const stack = panel.getChildByName("stack");
        stack.children.forEach((child: Rectangle, i: number) => {
            const point = points[i];
            const image = child.children[0] as Image;
            if (point !== undefined) {
                child.isVisible = true;
                image.source = Config.pointImagePath.replace("${point}", point.toString());
            } else {
                child.isVisible = false;
            }
        });
    }

    hide() {
        this.root.isVisible = false;
    }
}
