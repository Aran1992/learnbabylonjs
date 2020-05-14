import Config from "./Config";

export default class PlayerInfo {
    public uid: number;
    public seat: number;
    public name: string;
    public money: number;
    public dices: number[] = [];
    public befDices: number[] = [];
    public diceCount: number = Config.cup.initCount;
    public ready: boolean = false;
    public readyEndedTime: number;
    public rolled: boolean = false;
    public rollEndedTime: number;
    public called: boolean = false;
    public calledEndedTime: number;
}
