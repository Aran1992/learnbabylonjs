import GameScene from "./GameScene";
import GUI from "./GUI";
import Config from "./Config";
import PlayerData from "./PlayerData";

declare const pomelo;

class GameMgr_ {
    public inited: boolean;
    public selfPlayerData: PlayerData;
    public otherPlayerDataList: PlayerData[] = [];
    public playerDataList: PlayerData[] = [];
    public eliminateOpePlayerIndex;
    private gameScene: GameScene;
    private gui: GUI;

    init() {
        this.register();
        this.gameScene = new GameScene();
        this.gui = new GUI();
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

    public onReadyForBamao(data) {
        this.playerDataList[this.getPlayerIndexByUid(data.uid)].ready = !!data.ready;
    }

    public onEliminateStartForBamao(data) {
        this.eliminateOpePlayerIndex = this.getPlayerIndexByUid(data.opeUid);
        // todo 设置自己的骰子
    }

    public onEliminateOpeForBamao() {
        // todo 设置所有人的之前和之后的骰子
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
            "onStartReadyForBamao",
            "onEnterRoom",
            "onReadyForBamao",
            "onLeaveRoom",
            "onStartForBamao",
            "onSendDiceForBamao",
            "onEliminateStartForBamao",
            "onEliminateOpeForBamao",
            "onGameOverForBamao",
        ].forEach(event => {
            pomelo.on(event, (...args) => {
                console.log("pomelo event", event, ...args);
                [this, this.gameScene, this.gui].forEach(mgr => mgr[event] && mgr[event](...args));
            });
        });
    }
}

const GameMgr = new GameMgr_();
export default GameMgr;
