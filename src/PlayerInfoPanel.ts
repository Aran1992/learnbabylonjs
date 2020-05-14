import {Image, Rectangle, TextBlock} from "babylonjs-gui";
import DataMgr from "./DataMgr";
import PlayerInfo from "./PlayerInfo";
import {EStage} from "./EStage";

export default class PlayerInfoPanel {
    private index: number;
    private panel: Rectangle;
    private frameImage: Image;
    private nameText: TextBlock;
    private moneyIcon: Image;
    private moneyText: TextBlock;
    private readyIcon: Image;
    private thinkingIcon: Image;
    private remainTimeText: TextBlock;
    private noDiceText: TextBlock;
    private animationID: number;
    private endedTime: number;

    constructor(index: number, panel: Rectangle, params) {
        this.index = index;

        this.panel = panel;
        this.panel.thickness = 0;

        this.frameImage = new Image();
        this.panel.addControl(this.frameImage);
        this.frameImage.source = params.frameImage.source;
        this.frameImage.autoScale = true;
        this.frameImage.stretch = Image.STRETCH_FILL;

        this.nameText = new TextBlock();
        this.panel.addControl(this.nameText);
        this.nameText.color = "#e9b841";
        this.nameText.fontSize = params.nameText.fontSize;
        this.nameText.top = params.nameText.top;
        this.nameText.text = "玩家名字";

        this.moneyIcon = new Image();
        this.panel.addControl(this.moneyIcon);
        this.moneyIcon.source = "assets/image/icon_gold.png";
        this.moneyIcon.width = `${params.moneyIcon.width}px`;
        this.moneyIcon.height = `${params.moneyIcon.height}px`;
        this.moneyIcon.top = params.moneyIcon.top;
        this.moneyIcon.left = params.moneyIcon.left;

        this.moneyText = new TextBlock();
        this.panel.addControl(this.moneyText);
        this.moneyText.color = "#e9b841";
        this.moneyText.fontSize = params.moneyText.fontSize;
        this.moneyText.top = params.moneyText.top;
        this.moneyText.text = "玩家金钱";

        this.readyIcon = new Image();
        this.panel.addControl(this.readyIcon);
        this.readyIcon.source = "assets/image/icon_ready.png";
        this.readyIcon.autoScale = true;
        this.readyIcon.stretch = Image.STRETCH_FILL;
        this.readyIcon.top = params.readyIcon.top;

        this.thinkingIcon = new Image();
        this.panel.addControl(this.thinkingIcon);
        this.thinkingIcon.source = "assets/image/thinking_text.png";
        this.thinkingIcon.autoScale = true;
        this.thinkingIcon.stretch = Image.STRETCH_FILL;
        this.thinkingIcon.top = params.thinkingIcon.top;

        this.remainTimeText = new TextBlock();
        this.panel.addControl(this.remainTimeText);
        this.remainTimeText.color = "red";
        this.remainTimeText.text = "123";

        this.noDiceText = new TextBlock();
        this.panel.addControl(this.noDiceText);
        this.noDiceText.color = "red";
        this.noDiceText.text = "没有骰子了";

        this.panel.isVisible = false;
    }

    public show(dataMgr: DataMgr, playerInfo: PlayerInfo) {
        if (!playerInfo.name || !playerInfo.money) {
            debugger;
        }
        this.panel.isVisible = true;
        this.nameText.text = playerInfo.name;
        this.moneyText.text = playerInfo.money.toString();
        this.readyIcon.isVisible = false;
        this.thinkingIcon.isVisible = false;
        this.remainTimeText.isVisible = false;
        this.noDiceText.isVisible = false;
        if (this.animationID !== undefined) {
            cancelAnimationFrame(this.animationID);
            delete this.animationID;
        }
        if (!playerInfo.ready && dataMgr.curStage !== EStage.Ready) {
            return;
        }
        switch (dataMgr.curStage) {
            case EStage.Ready: {
                this.readyIcon.isVisible = playerInfo.ready;
                if (!playerInfo.ready) {
                    this.endedTime = playerInfo.readyEndedTime;
                    this.onFrame();
                }
                break;
            }
            case EStage.Start: {
                break;
            }
            case EStage.Roll: {
                if (playerInfo.diceCount === 0) {
                }
                if (this.index === dataMgr.selfPlayerIndex) {
                }
                if (!playerInfo.rolled) {
                    this.endedTime = playerInfo.rollEndedTime;
                    this.onFrame();
                }
                break;
            }
            case EStage.Call: {
                this.thinkingIcon.isVisible = !playerInfo.called
                    && this.index === dataMgr.callPlayerIndex;
                if (!playerInfo.called
                    && dataMgr.callPlayerIndex === this.index) {
                    this.endedTime = playerInfo.calledEndedTime;
                    this.onFrame();
                }
                break;
            }
            case EStage.Show: {
                break;
            }
        }
    }

    public hide() {
        this.panel.isVisible = false;
        if (this.animationID !== undefined) {
            cancelAnimationFrame(this.animationID);
            delete this.animationID;
        }
    }

    public onFrame = () => {
        const remainTime = this.endedTime - new Date().getTime();
        if (remainTime > 0) {
            this.remainTimeText.isVisible = true;
            this.remainTimeText.text = Math.ceil(remainTime / 1000).toString();
            this.animationID = requestAnimationFrame(this.onFrame);
        } else {
            this.remainTimeText.isVisible = false;
        }
    }
}
