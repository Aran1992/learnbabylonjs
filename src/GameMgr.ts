import GameScene from "./GameScene";
import GUI from "./GUI";
import Config from "./Config";

declare const pomelo;

class GameMgr_ {
    public inited: boolean;
    public selfInfo;
    public otherPlayerInfo;
    public readyEndTime: number;
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
            if (data.ready) {
                this.selfInfo.ready = true;
                this.gui.onSelfReady();
            }
        });
    }

    public eliminate(target: number[]) {
        this.request("roomBamao.roomHandler.eliminate", {target}, () => {
        });
    }

    public onStartReadyForBamao(data) {
        this.readyEndTime = data.readyEndTime * 1000;
    }

    public onEnterRoom(data) {
        this.otherPlayerInfo[data.uid] = data;
    }

    public onReadyForBamao(data) {
        this.otherPlayerInfo[data.uid].ready = data.ready;
    }

    public getPlayerIndex(seatNum) {
        let index = seatNum - GameMgr.selfInfo.seatNum;
        if (index < 0) {
            index = Config.cups.length + index;
        }
        return index;
    }

    private requestInitData() {
        fetch("http://192.168.18.80:28302/products/dwc_29.json").then(initResponse => {
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
                                    this.request("connector.entryHandler.login", {token: loginData.body.token}, data => {
                                        this.request("roomBamao.roomHandler.enterRoom", {
                                            gameId: 2,
                                            roomType: 1
                                        }, data => {
                                            this.inited = true;
                                            this.selfInfo = {
                                                uid: loginData.body.uid,
                                                nickname: "自己",
                                                gold: data.gold,
                                                seatNum: data.seatNum,
                                                ready: false,
                                            };
                                            this.otherPlayerInfo = data.otherPlayerInfo;
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
