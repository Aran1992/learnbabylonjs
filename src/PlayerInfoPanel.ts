import {Image, Rectangle, TextBlock} from "babylonjs-gui";
import PlayerData from "./PlayerData";
import GameMgr from "./GameMgr";
import {StackPanel} from "babylonjs-gui/2D/controls/stackPanel";
import DicePanel from "./DicePanel";

export default class PlayerInfoPanel {
    private playerInfoRect: Rectangle;
    private name: TextBlock;
    private money: TextBlock;
    private ready: Image;
    private dead: TextBlock;
    private winMoney: TextBlock;
    private loseMoney: TextBlock;
    private diceRect: Rectangle;
    private curDiceRect: Rectangle;
    private befDiceRect: Rectangle;
    private curDicePanel: DicePanel;
    private befDicePanel: DicePanel;

    constructor(playerInfoRect: Rectangle) {
        this.playerInfoRect = playerInfoRect;
        this.name = this.playerInfoRect.getChildByName("name") as TextBlock;
        this.money = this.playerInfoRect.getChildByName("money") as TextBlock;
        this.ready = this.playerInfoRect.getChildByName("ready") as Image;
        this.dead = this.playerInfoRect.getChildByName("dead") as TextBlock;
        this.winMoney = this.playerInfoRect.getChildByName("winMoney") as TextBlock;
        this.loseMoney = this.playerInfoRect.getChildByName("loseMoney") as TextBlock;
        this.diceRect = this.playerInfoRect.getChildByName("diceRect") as Rectangle;
        this.curDiceRect = this.diceRect.getChildByName("curDiceRect") as Rectangle;
        this.befDiceRect = this.diceRect.getChildByName("befDiceRect") as Rectangle;
        this.curDicePanel = new DicePanel(this.curDiceRect.getChildByName("innerCurDiceRect") as StackPanel);
        this.befDicePanel = new DicePanel(this.befDiceRect.getChildByName("innerBefDiceRect") as StackPanel);
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
        this.dead.isVisible = playerData.dead;
        this.winMoney.isVisible = false;
        this.loseMoney.isVisible = false;
        this.diceRect.isVisible = false;
        // if (playerData.dice) {
        //     this.diceRect.isVisible = true;
        //     this.curDicePanel.refresh(playerData.dice);
        //     if (playerData.befDice) {
        //         this.befDiceRect.isVisible = true;
        //         this.befDicePanel.refresh(playerData.befDice);
        //     } else {
        //         this.befDiceRect.isVisible = false;
        //     }
        // } else {
        //     this.diceRect.isVisible = false;
        // }
    }
}
