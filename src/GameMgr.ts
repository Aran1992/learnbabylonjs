import GameScene from "./GameScene";
import GUI from "./GUI";
import Config from "./Config";
import PlayerData from "./PlayerData";

declare const pomelo;
declare const addPercent;

class GameMgr_ {
    public inited: boolean;
    public isInPreparationStep: boolean;
    public startAnimation: boolean;
    public selfPlayerData: PlayerData;
    public otherPlayerDataList: PlayerData[] = [];
    public playerDataList: PlayerData[] = [];
    public eliminateOpePlayerIndex: number;
    public eliminateEndTime: number;
    private gameScene: GameScene;
    private gui: GUI;

    public get rollFinalTime(): number {
        return GameMgr.eliminateEndTime - Config.rollAnimationDuration - Config.eliminateDuration;
    }

    public get isAllPlayerRollEnded(): boolean {
        return !this.playerDataList.some(player => !player.rolled);
    }

    init() {
        this.register();
        this.gameScene = new GameScene();
        this.gui = new GUI(this.gameScene);
        this.requestInitData();
    }

    public ready() {
        this.request("roomBamao.roomHandler.ready", {}, (data) => {
            this.selfPlayerData.ready = !!data.ready;
            if (data.ready) {
                this.gui.onSelfReady();
            }
        });
    }

    public eliminate(target: number[]) {
        this.request("roomBamao.roomHandler.eliminate", {target}, () => {
        });
    }

    public onEnterRoom(data) {
        const index = this.getPlayerIndexBySeat(data.seatNum);
        this.otherPlayerDataList[index] = this.playerDataList[index] = new PlayerData(data);
    }

    public onLeaveRoom(data) {
        const index = this.getPlayerIndexByUid(data.uid);
        this.gameScene.removePlayer(index);
        this.gui.removePlayer(index);
        delete this.otherPlayerDataList[index];
        delete this.playerDataList[index];
    }

    public onStartReadyForBamao() {
        this.isInPreparationStep = true;
        this.playerDataList.forEach(info => info.ready = false);
    }

    public onReadyForBamao(data) {
        this.playerDataList[this.getPlayerIndexByUid(data.uid)].ready = !!data.ready;
    }

    public onStartForBamao() {
        this.isInPreparationStep = false;
        this.playerDataList.forEach(info => {
            delete info.dice;
            delete info.befDice;
            delete info.dead;
        });
    }

    public onSendDiceForBamao(data) {
        this.selfPlayerData.dice = data.dice.sort();
        delete this.selfPlayerData.befDice;
        this.otherPlayerDataList.forEach(info => {
            delete info.dice;
            delete info.befDice;
        });
        this.playerDataList.forEach(info => info.rolled = false);
    }

    public onEliminateStartForBamao(data) {
        this.eliminateOpePlayerIndex = this.getPlayerIndexByUid(data.opeUid);
        this.eliminateEndTime = data.endTime * 1000;
    }

    public onEliminateOpeForBamao(data) {
        data.playerSeatList.forEach((seatNum) => {
            const index = this.getPlayerIndexBySeat(seatNum);
            const info = this.playerDataList[index];
            const befDice = data.befDice[seatNum] || [];
            if (befDice.length !== 0) {
                info.befDice = befDice.sort();
                info.dice = info.befDice.filter(point => data.removeDice.indexOf(point) === -1);
                if (info.dice.length === 0) {
                    info.dead = true;
                }
            } else {
                delete info.befDice;
                delete info.dice;
            }
        });
    }

    public getPlayerIndexBySeat(seatNum: number): number {
        let index = seatNum - GameMgr.selfPlayerData.seatNum;
        if (index < 0) {
            index = Config.cups.length + index;
        }
        return index;
    }

    public getPlayerIndexByUid(uid: number): number {
        return this.playerDataList.findIndex(player => player && player.uid === uid);
    }

    public getPlayerDataByUid(uid: number): PlayerData {
        return this.playerDataList[this.getPlayerIndexByUid(uid)];
    }

    private requestInitData() {
        const ip = "111.229.243.99";
        // const ip = "192.168.18.80";
        console.log("ip", ip);
        fetch(`http://${ip}:28302/products/dwc_29.json`).then(initResponse => {
            initResponse.json().then(initData => {
                fetch(`http://${initData.platSvrHost}:${initData.platSvrPort}`, {
                    method: "POST",
                    headers: [["Content-Type", "application/json;charset=utf-8"]],
                    body: JSON.stringify({
                        head: {route: "http.ReqLogin", msgindex: 0, token: null},
                        body: {plat: 2, username: new Date().getTime().toString(), password: '13456'},
                    })
                }).then(loginResponse => {
                    loginResponse.json().then(loginData => {
                        console.log("loginData", loginData);
                        pomelo.init({host: initData.gameSvrHost, port: initData.gameSvrPort,}, () => {
                            this.request("gate.gateHandler.queryEntry", {}, data => {
                                pomelo.disconnect();
                                pomelo.init({
                                    host: data.host,
                                    port: data.port,
                                }, () => {
                                    this.request("connector.entryHandler.login", {token: loginData.body.token}, entryLoginData => {
                                        this.request("roomBamao.roomHandler.enterRoom", {
                                            gameId: 2,
                                            roomType: 1
                                        }, enterRoomData => {
                                            this.inited = true;
                                            this.selfPlayerData =
                                                this.playerDataList[0] =
                                                    new PlayerData({
                                                        uid: loginData.body.uid,
                                                        nickname: entryLoginData.userData.nickname,
                                                        gold: enterRoomData.gold,
                                                        seatNum: enterRoomData.seatNum,
                                                        ready: false,
                                                    });
                                            for (const uid in enterRoomData.otherPlayerInfo) {
                                                if (enterRoomData.otherPlayerInfo.hasOwnProperty(uid)) {
                                                    const playerData = enterRoomData.otherPlayerInfo[uid];
                                                    const index = this.getPlayerIndexBySeat(playerData.seatNum);
                                                    this.otherPlayerDataList[index] =
                                                        this.playerDataList[index] =
                                                            new PlayerData(playerData);
                                                }
                                            }
                                            addPercent(0.2);
                                            this.gameScene.onGameInited();
                                            this.gui.onGameInited();
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

    private request(name, data, callback) {
        console.log("pomelo request", name, data);
        pomelo.request(name, data, (...args) => {
            console.log("pomelo response", name, ...args);
            callback(...args);
        });
    }

    private register() {
        [
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
                [this, this.gameScene, this.gui].forEach(mgr => mgr[event] && mgr[event](...args));
            });
        });
    }
}

const GameMgr = new GameMgr_();
export default GameMgr;
