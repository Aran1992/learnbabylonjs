import Config from "./Config";
import {AdvancedDynamicTexture, Image, Rectangle, TextBlock, XmlLoader} from "babylonjs-gui";

export default class GUI {
    private xmlLoader: XmlLoader;

    constructor() {
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
    }
}

