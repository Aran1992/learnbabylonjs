import Config from "./Config";
import {AdvancedDynamicTexture, Image, Rectangle, TextBlock, XmlLoader} from "babylonjs-gui";
import GameMgr from "./GameMgr";
import EventMgr from "./EventMgr";

export default class GUI {
    private xmlLoader: XmlLoader;
    private gameMgr: GameMgr;
    private eventMgr: EventMgr;

    constructor(gameMgr: GameMgr, eventMgr: EventMgr) {
        this.gameMgr = gameMgr;
        this.eventMgr = eventMgr;

        const canvas = document.getElementById("canvas") as HTMLCanvasElement;
        let renderScale;
        if (canvas.width / canvas.height > Config.designWidth / Config.designHeight) {
            renderScale = Config.designHeight / canvas.height;
        } else {
            renderScale = Config.designWidth / canvas.width;
        }

        const background = AdvancedDynamicTexture.CreateFullscreenUI("", false);
        background.renderScale = renderScale;
        const image = new Image("", Config.bgImagePath);
        image.autoScale = true;
        image.stretch = Image.STRETCH_NONE;
        background.addControl(image);

        const foreground = AdvancedDynamicTexture.CreateFullscreenUI("", true);
        foreground.renderScale = renderScale;
        this.xmlLoader = new XmlLoader();
        this.xmlLoader.loadLayout(Config.uiXMLPath, foreground, this.onLoaded.bind(this));

        this.eventMgr.register("gameInit", this.onGameInit.bind(this));
    }

    private _loaded = false;

    public get loaded() {
        return this._loaded;
    }

    public onStartPreparation() {
        this.xmlLoader.getNodeById("loadingRect").isVisible = false;
        this.xmlLoader.getNodeById("preparationRect").isVisible = true;
    }

    public onPrepared() {
        this.xmlLoader.getNodeById("preparedText").isVisible = true;
        this.xmlLoader.getNodeById("startBtn").isVisible = false;
    }

    private onGameInit() {
        if (this.loaded) {
            this.onStartPreparation();
        }
    }

    // todo 自动对按钮进行事件绑定
    // todo 加载完毕之后根据状态进行显示
    private onLoaded() {
        for (let i = 0; i < Config.cups.length; i++) {
            const playerInfo = this.xmlLoader.getNodeById(`playerInfo${i}`) as Rectangle;
            const name = playerInfo.getChildByName("name") as TextBlock;
            name.text = "";
            const money = playerInfo.getChildByName("money") as TextBlock;
            money.text = "";
        }
        this.onClick(this.xmlLoader.getNodeById("startBtn"), this.onClickStartBtn.bind(this));
        this._loaded = true;
        if (this.gameMgr.inited) {
            this.onStartPreparation();
        }
    }

    private onClickLeaveBtn() {
    }

    private onClickStartBtn() {
        this.gameMgr.prepare();
    }

    private onClickChangeBtn() {
    }

    private onClick(button, callback) {
        button.onPointerUpObservable.add(callback);
    }
}


