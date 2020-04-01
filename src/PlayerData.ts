import GameMgr from "./GameMgr";
import Config from "./Config";

export default class PlayerData {
    public uid: number;
    public gold: number;
    public seatNum: number;
    public nickname: string;
    public ready: boolean;
    public diceCount: number;
    public dices: number[];

    constructor(data: { uid: number, gold: number, seatNum: number, nickname: string, ready: boolean }) {
        this.uid = data.uid;
        this.gold = data.gold;
        this.seatNum = data.seatNum;
        this.nickname = data.nickname;
        this.ready = data.ready;
        this.diceCount = Config.cup.initCount;
    }

    public get index(): number {
        return GameMgr.getPlayerIndexByUid(this.uid);
    }
}
