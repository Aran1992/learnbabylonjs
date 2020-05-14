import {EStage} from "./EStage";
import PlayerInfo from "./PlayerInfo";
import EventMgr from "./EventMgr";
import {Event} from "./Event";
import Config from "./Config";

declare const pomelo;

enum ServerState {
    None,
    Ready,
    PlayMV,
    EliminateStart,
    EliminateResult,
    GameOver,
}

export default class DataMgr {
    public initDataReceived: boolean;
    public readonly selfPlayerIndex = 0;
    public selfPlayerInfo: PlayerInfo;
    public playerInfoList: PlayerInfo[] = [];
    public curStage: EStage;
    public rollEndedTime: number;
    public callPlayerIndex: number;
    public callPoints: number[];
    public gameRound: number;
    private showEndedTime: number;
    private initDataReceivedCallback: CallableFunction;
    private serverTimeDiff: number;
    private callPlayerUid: number;
    private calledEndedTime: number;
    private selfDice: number[];
    private lastCallUid: number;

    public set onInitDataReceived(callback: CallableFunction) {
        this.initDataReceivedCallback = callback;
        if (this.initDataReceived) {
            this.initDataReceivedCallback();
        }
    }

    public init() {
        this.register();
        this.requestInitData();
    }

    public ready() {
        this.request("roomBamao.roomHandler.ready", {}, () => {
            this.onReadyForBamao({uid: this.selfPlayerInfo.uid});
        });
    }

    public change() {
        this.request("roomBamao.roomHandler.exitRoom", {}, () => {

        });
    }

    public eliminate(target: number[]) {
        this.request("roomBamao.roomHandler.eliminate", {target}, () => {
        });
    }

    public getPlayerIndexBySeat(seat: number): number {
        let index = seat - this.selfPlayerInfo.seat;
        if (index < 0) {
            index = Config.cups.length + index;
        }
        return index;
    }

    public getPlayerIndexByUid(uid: number): number {
        let index = undefined;
        this.playerInfoList.forEach((player, i) => {
            if (player && player.uid === uid) {
                index = i;
            }
        });
        return index;
    }

    private setStage(newStage: EStage) {
        const oldStage = this.curStage;
        this.curStage = newStage;
        EventMgr.notify(Event.StageChange, newStage, oldStage);
    }

    private requestInitData() {
        console.log("ip", Config.ip);
        fetch(`http://${Config.ip}:28302/products/dwc_29.json`).then(initResponse => {
            initResponse.json().then(initData => {
                console.log("获取初始信息", initData);
                fetch(`http://${initData.platSvrHost}:${initData.platSvrPort}`, {
                    method: "POST",
                    headers: [["Content-Type", "application/json;charset=utf-8"]],
                    body: JSON.stringify({
                        head: {route: "http.ReqLogin", msgindex: 0, token: null},
                        body: {plat: 2, username: "lzd1", password: "123456"},
                    })
                }).then(loginResponse => {
                    loginResponse.json().then(loginData => {
                        console.log("登陆平台", loginData);
                        pomelo.init({host: initData.gameSvrHost, port: initData.gameSvrPort,}, () => {
                            this.request("gate.gateHandler.queryEntry", {}, data => {
                                pomelo.disconnect();
                                pomelo.init({
                                    host: Config.ip,
                                    port: data.port,
                                }, () => {
                                    this.request("connector.entryHandler.login", {token: loginData.body.token}, entryLoginData => {
                                        this.request("roomBamao.roomHandler.enterRoom", {
                                            gameId: 2,
                                            roomType: 1
                                        }, enterRoomData => {
                                            this.serverTimeDiff = new Date().getTime() - enterRoomData.serverTime;
                                            this.selfDice = enterRoomData.dice;
                                            this.gameRound = enterRoomData.gameRound;
                                            this.lastCallUid = enterRoomData.lastCallUid;

                                            const info = new PlayerInfo();
                                            info.uid = entryLoginData.userData.uid;

                                            info.seat = enterRoomData.seatNum || 0;
                                            info.name = entryLoginData.userData.nickname;
                                            info.money = enterRoomData.gold;
                                            info.ready = !!enterRoomData.ready;
                                            this.selfPlayerInfo =
                                                this.playerInfoList[this.selfPlayerIndex] = info;

                                            for (const uid in enterRoomData.otherPlayerInfo) {
                                                if (enterRoomData.otherPlayerInfo.hasOwnProperty(uid)) {
                                                    const data = enterRoomData.otherPlayerInfo[uid];
                                                    const index = this.getPlayerIndexBySeat(data.seatNum);
                                                    const info = new PlayerInfo();
                                                    info.uid = data.uid;
                                                    info.seat = data.seatNum;
                                                    info.name = data.nickname;
                                                    info.money = data.gold;
                                                    info.ready = !!data.ready;
                                                    info.dices = data.dice;
                                                    info.diceCount = data.diceCount;
                                                    this.playerInfoList[index] = info;
                                                }
                                            }

                                            // todo 将服务器的状态转为客户端的状态
                                            if (enterRoomData.gameState === ServerState.Ready) {
                                                this.curStage = EStage.Ready;
                                            } else if (enterRoomData.gameState === ServerState.PlayMV) {
                                                this.curStage = EStage.Start;
                                            } else if (enterRoomData.gameState === ServerState.EliminateStart) {
                                                this.updateCallAndRollState();
                                                // 断线重连的时候无论如何都认为是摇了
                                                this.playerInfoList.forEach(info => {
                                                    info.rolled = true;
                                                });
                                                const cur = new Date().getTime();
                                                if (cur < this.rollEndedTime) {
                                                    this.curStage = EStage.Roll;
                                                } else {
                                                    this.curStage = EStage.Call;
                                                }
                                            } else if (enterRoomData.gameState === ServerState.EliminateResult
                                                || enterRoomData.gameState === ServerState.GameOver) {
                                                this.curStage = EStage.Show;
                                            }
                                            this.initDataReceived = true;
                                            if (this.initDataReceivedCallback) {
                                                this.initDataReceivedCallback();
                                            }
                                        });
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    }

    private onEnterRoom(data) {
        const index = this.getPlayerIndexBySeat(data.seatNum);
        const info = new PlayerInfo();
        info.uid = data.uid;
        info.seat = data.seatNum;
        info.name = data.nickname;
        info.money = data.gold;
        info.ready = false;
        // todo 玩家进场之后还需要下一个准备消息才能进行准备吗？
        info.readyEndedTime = new Date().getTime() + Config.decideReadyDuration;
        this.playerInfoList[index] = info;
        EventMgr.notify(Event.PlayerEnterRoom, index);
    }

    private onLeaveRoom(data) {
        const index = this.getPlayerIndexByUid(data.uid);
        if (index !== undefined) {
            delete this.playerInfoList[index];
            EventMgr.notify(Event.PlayerLeaveRoom, index);
        }
    }

    private onNotifyGameStateForBamao({gameState}) {
        switch (gameState) {
            case ServerState.Ready: {
                this.playerInfoList.forEach((info, i) => {
                    info.ready = false;
                });
                this.setStage(EStage.Ready);
                break;
            }
            case ServerState.PlayMV: {
                this.gameRound = 0;
                delete this.lastCallUid;
                this.setStage(EStage.Start);
                break;
            }
            case ServerState.EliminateStart: {
                if (this.lastCallUid === undefined) {
                    const playerIndexList = [];
                    this.playerInfoList.forEach((info, i) => {
                        playerIndexList.push(i);
                    });
                    let indexIndex = playerIndexList.indexOf(this.callPlayerIndex) - 1;
                    if (indexIndex < 0) {
                        indexIndex = playerIndexList.length - 1;
                    }
                    this.lastCallUid = this.playerInfoList[playerIndexList[indexIndex]].uid;
                }
                this.updateCallAndRollState();
                this.setStage(EStage.Roll);
                break;
            }
            case ServerState.EliminateResult: {
                const callUid = this.playerInfoList[this.callPlayerIndex].uid;
                if (callUid === this.lastCallUid) {
                    this.gameRound++;
                }
                this.setStage(EStage.Show);
                break;
            }
            case ServerState.GameOver: {
                this.setStage(EStage.Show);
                break;
            }
        }
    }

    private updateCallAndRollState() {
        if (this.selfPlayerInfo.ready) {
            this.selfPlayerInfo.diceCount = this.selfDice.length;
            this.selfPlayerInfo.dices = this.selfDice.sort();
        }
        this.callPlayerIndex = this.getPlayerIndexByUid(this.callPlayerUid);
        const info = this.playerInfoList[this.callPlayerIndex];
        info.called = false;
        info.calledEndedTime = this.calledEndedTime;
        const cur = new Date().getTime();
        this.rollEndedTime = info.calledEndedTime - Config.rollAnimationDuration - Config.decideCallDuration;
        if (cur < this.rollEndedTime) {
            this.playerInfoList.forEach(info => {
                info.rolled = false;
                info.rollEndedTime = this.rollEndedTime;
            });
        } else {
            this.playerInfoList.forEach(info => {
                info.rolled = true;
                info.rollEndedTime = this.rollEndedTime;
            });
        }
        this.playerInfoList.forEach(info => {
            info.rolled = false;
            info.rollEndedTime = 0;
        });
    }

    private onStartReadyForBamao(data) {
        // 这个消息会在每次有人进入房间的时候发出
        // 所以可能已经进入准备阶段之后再次姐收到这个消息
        this.playerInfoList.forEach((info, i) => {
            info.readyEndedTime = this.serverTime2localTime(data.otherPlayerReadyTime[info.uid] * 1000);
        });
        this.setStage(EStage.Ready);
    }

    private onReadyForBamao({uid}) {
        const index = this.getPlayerIndexByUid(uid);
        this.playerInfoList[index].ready = true;
        EventMgr.notify(Event.PlayerReady, index);
    }

    private onStartForBamao() {
        this.playerInfoList.forEach(info => {
            info.diceCount = Config.cup.initCount;
            info.dices = [];
            info.befDices = [];
        });
    }

    private onSendDiceForBamao({dice}) {
        this.selfDice = dice;
    }

    private onEliminateStartForBamao({endTime, opeUid}) {
        this.calledEndedTime = this.serverTime2localTime(endTime * 1000);
        this.callPlayerUid = opeUid;
    }

    private onEliminateOpeForBamao({endTime, befDice, removeDice}) {
        this.showEndedTime = this.serverTime2localTime(endTime * 1000);
        removeDice.sort();
        this.playerInfoList.forEach((info, playerIndex) => {
            info.befDices = befDice[info.seat] || [];
            info.befDices.sort();
            info.dices = info.befDices.filter(n => removeDice.indexOf(n) === -1);
            info.diceCount = info.dices.length;
        });
        this.callPoints = removeDice;
    }

    private onGameOverForBamao({result}) {
        this.playerInfoList.forEach((info) => {
            const change = result[info.uid];
            if (change) {
                info.money = change.currGold + change.changeGold;
            }
        });
    }

    private request(name, data, callback) {
        console.log("pomelo request", name, data);
        pomelo.request(name, data, (...args) => {
            console.log("pomelo response", name, ...args);
            callback(...args);
        });
    }

    private register() {
        [
            "onNotifyGameStateForBamao",
            "onEnterRoom",
            "onLeaveRoom",
            "onStartReadyForBamao",
            "onReadyForBamao",
            "onStartForBamao",
            "onSendDiceForBamao",
            "onEliminateStartForBamao",
            "onEliminateOpeForBamao",
            "onGameOverForBamao",
        ].forEach(event => {
            pomelo.on(event, (...args) => {
                console.log(new Date().getTime(), "pomelo event", event, ...args);
                [this,].forEach(mgr => mgr[event] && mgr[event](...args));
            });
        });
    }

    private serverTime2localTime(time: number) {
        return time + this.serverTimeDiff;
    }
}
