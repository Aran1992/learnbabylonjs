import {Button, Image, Rectangle, XmlLoader} from "babylonjs-gui";
import Config from "./Config";
import Util from "./Util";
import DataMgr from "./DataMgr";

export default class ChoosePointPanel {
    private dataMgr: DataMgr;
    private xmlLoader: XmlLoader;
    private root: Rectangle;
    private callBtn: Button;
    private pointBtn: Button[] = [];
    private smallBtn: Button;
    private bigBtn: Button;
    private singleBtn: Button;
    private doubleBtn: Button;
    private points: number[];
    private isSmall: boolean;
    private isSingle: boolean;
    private type: string;

    constructor(dataMgr: DataMgr, xmlLoader: XmlLoader) {
        this.dataMgr = dataMgr;
        this.xmlLoader = xmlLoader;
        this.root = this.xmlLoader.getNodeById("callRect");
        for (let i = 1; i <= Config.dice.sides.length; i++) {
            this.pointBtn[i] = xmlLoader.getNodeById(`point${i}`);
            Util.onClick(this.pointBtn[i], () => this.clickPointBtn(i));
        }
        this.smallBtn = xmlLoader.getNodeById("point_small");
        this.bigBtn = xmlLoader.getNodeById("point_big");
        this.singleBtn = xmlLoader.getNodeById("point_single");
        this.doubleBtn = xmlLoader.getNodeById("point_double");
        this.callBtn = xmlLoader.getNodeById("callBtn");
        Util.onClick(this.singleBtn, () => this.onClickSingleDoubleBtn(true));
        Util.onClick(this.doubleBtn, () => this.onClickSingleDoubleBtn(false));
        Util.onClick(this.smallBtn, () => this.onClickSmallBigBtn(true));
        Util.onClick(this.bigBtn, () => this.onClickSmallBigBtn(false));
        Util.onClick(this.callBtn, () => this.onClickCallBtn());
        this.refresh();
    }

    public show() {
        this.root.isVisible = true;
        delete this.points;
        delete this.isSmall;
        delete this.isSingle;
        delete this.type;
        this.refresh();
    }

    public hide() {
        this.root.isVisible = false;
    }

    private getSelectedPoints(): number[] {
        switch (this.type) {
            case "point": {
                return this.points.sort();
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
                = this.type === "point" && this.points.indexOf(point) !== -1;
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
            this.points = [point];
        } else if (this.points.indexOf(point) !== -1) {
            Util.removeItemFromArray(this.points, point);
        } else if (this.points.length >= Config.maxSelectPoint) {

        } else {
            this.points.push(point);
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
        this.dataMgr.eliminate(this.getSelectedPoints());
    }
}
