import {Button, Control, Image, Rectangle, XmlLoader} from "babylonjs-gui";
import Config from "./Config";
import GameMgr from "./GameMgr";

export default class ChoosePointPanel {
    private xmlLoader: XmlLoader;
    private root: Rectangle;
    private callBtn: Button;
    private pointBtn: Button[] = [];
    private smallBtn: Button;
    private bigBtn: Button;
    private singleBtn: Button;
    private doubleBtn: Button;
    private points: Set<number>;
    private isSmall: boolean;
    private isSingle: boolean;
    private type: string;

    constructor(xmlLoader: XmlLoader) {
        this.xmlLoader = xmlLoader;
        this.root = this.xmlLoader.getNodeById("pointsRect");
        for (let i = 1; i <= Config.dice.sides.length; i++) {
            this.pointBtn[i] = xmlLoader.getNodeById(`point${i}`);
            this.onClick(this.pointBtn[i], () => this.clickPointBtn(i));
        }
        this.smallBtn = xmlLoader.getNodeById("point_small");
        this.bigBtn = xmlLoader.getNodeById("point_big");
        this.singleBtn = xmlLoader.getNodeById("point_single");
        this.doubleBtn = xmlLoader.getNodeById("point_double");
        this.callBtn = xmlLoader.getNodeById("callBtn");
        this.onClick(this.singleBtn, () => this.onClickSingleDoubleBtn(true));
        this.onClick(this.doubleBtn, () => this.onClickSingleDoubleBtn(false));
        this.onClick(this.smallBtn, () => this.onClickSmallBigBtn(true));
        this.onClick(this.bigBtn, () => this.onClickSmallBigBtn(false));
        this.onClick(this.callBtn, () => this.onClickCallBtn());
        this.refresh();
    }

    public set isVisible(visible: boolean) {
        this.root.isVisible = visible;
    }

    public reset() {
        delete this.points;
        delete this.isSmall;
        delete this.isSingle;
        delete this.type;
        this.refresh();
    }

    private getSelectedPoints(): number[] {
        switch (this.type) {
            case "point": {
                return Array.from(this.points).sort();
            }
            case "singleDouble": {
                return this.isSingle ? [1, 3, 5] : [2, 4, 6];
            }
            case "smallBig": {
                return this.isSmall ? [1, 2, 3] : [4, 5, 6];
            }
            default: {
                return [];
            }
        }
    }

    private refreshSelected() {
        const points = this.getSelectedPoints();
        for (let i = 0; i < Config.maxChoosePoint; i++) {
            const showPoint = this.xmlLoader.getNodeById(`showPoint${i}`) as Image;
            const connect = this.xmlLoader.getNodeById(`connect${i}`) as Rectangle;
            const point = points[i];
            if (point) {
                showPoint.isVisible = true;
                showPoint.source = Config.pointImagePath.replace("${point}", point.toString());
            } else {
                showPoint.isVisible = false;
            }
            if (connect) {
                connect.isVisible = point !== undefined;
            }
        }
    }

    private refresh() {
        this.pointBtn.forEach((btn, point) => {
            btn.getChildByName("selected").isVisible
                = this.type === "point" && this.points.has(point);
        });
        this.singleBtn.getChildByName("selected").isVisible
            = this.type === "singleDouble" && this.isSingle;
        this.doubleBtn.getChildByName("selected").isVisible
            = this.type === "singleDouble" && !this.isSingle;
        this.smallBtn.getChildByName("selected").isVisible
            = this.type === "smallBig" && this.isSmall;
        this.bigBtn.getChildByName("selected").isVisible
            = this.type === "smallBig" && !this.isSmall;
        this.refreshSelected();
    }

    private clickPointBtn(point: number) {
        if (this.type !== "point") {
            this.type = "point";
            this.points = new Set();
            this.points.add(point);
        } else if (this.points.has(point)) {
            this.points.delete(point);
        } else if (this.points.size >= Config.maxSelectPoint) {

        } else {
            this.points.add(point);
        }
        this.refresh();
    }

    private onClickSingleDoubleBtn(isSingle: boolean) {
        if (this.type !== "singleDouble") {
            this.type = "singleDouble";
        }
        this.isSingle = isSingle;
        this.refresh();
    }

    private onClickSmallBigBtn(isSmall: boolean) {
        if (this.type !== "smallBig") {
            this.type = "smallBig";
        }
        this.isSmall = isSmall;
        this.refresh();
    }

    private onClickCallBtn() {
        GameMgr.eliminate(this.getSelectedPoints());
    }

    private onClick(button: Control, callback) {
        button.onPointerUpObservable.add(callback);
    }
}