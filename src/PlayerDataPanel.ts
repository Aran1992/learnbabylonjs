import {Image, Rectangle, TextBlock} from "babylonjs-gui";
import PlayerData from "./PlayerData";
import GameMgr from "./GameMgr";

export default class PlayerDataPanel {
    private playerInfoRect: Rectangle;
    private name: TextBlock;
    private money: TextBlock;
    private ready: Image;
    private thinking: Image;

    constructor(playerInfoRect: Rectangle) {
        this.playerInfoRect = playerInfoRect;
        this.name = this.playerInfoRect.getChildByName("name") as TextBlock;
        this.money = this.playerInfoRect.getChildByName("money") as TextBlock;
        this.ready = this.playerInfoRect.getChildByName("ready") as Image;
        this.thinking = this.playerInfoRect.getChildByName("thinking") as Image;
    }

    public get isVisible(): boolean {
        return this.playerInfoRect.isVisible;
    }

    public set isVisible(visible: boolean) {
        this.playerInfoRect.isVisible = visible;
    }

    public refresh(playerData: PlayerData) {
        this.name.text = playerData.nickname;
        this.money.text = playerData.gold.toString();
        this.ready.isVisible = playerData.ready && GameMgr.isInPreparationStep;
        this.thinking.isVisible = playerData.isThinking;
    }
}
