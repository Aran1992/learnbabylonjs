import GameMgr from "./GameMgr";
import Config from "./Config";

export default class PlayerData {
    public uid: number;
    public gold: number;
    public seatNum: number;
    public nickname: string;
    public ready: boolean;
    public dead: boolean;
    public diceCount: number;
    public dice: number[];
    public befDice: number[];
    public rolled: boolean;

    constructor(data: { uid: number, gold: number, seatNum: number, nickname: string, ready: boolean }) {
        this.uid = data.uid;
        this.gold = data.gold;
        this.seatNum = data.seatNum;
        this.nickname = data.nickname;
        this.ready = data.ready;
        this.dead = false;
        this.diceCount = Config.cup.initCount;
    }

    public get index(): number {
        return GameMgr.getPlayerIndexByUid(this.uid);
    }

    public get isThinking(): boolean {
        return GameMgr.eliminateOpePlayerIndex === GameMgr.getPlayerIndexByUid(this.uid);
    }
}
