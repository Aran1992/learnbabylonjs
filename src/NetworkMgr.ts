export default class NetworkMgr {
    private callbackTable = {};

    constructor() {
    }

    public requestInitData(callback: CallableFunction) {
        callback();
    }

    public requestPrepare(callback: CallableFunction) {
        callback();
        setTimeout(() => {
            // this.callbackTable["start"]({isSelfBanker: Math.random() < 0.5});
            this.callbackTable["start"]({isSelfBanker: true});
        }, 1000);
    }

    public requestSelectPoint(point, callback: CallableFunction) {
        callback();
        setTimeout(() => {
            this.callbackTable["eliminate"]({point});
        }, 0);
    }

    public registerStart(callback: CallableFunction) {
        this.callbackTable["start"] = callback;
    }

    public registerEliminate(callback: CallableFunction) {
        this.callbackTable["eliminate"] = callback;
    }
}
