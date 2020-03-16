export default class NetworkMgr {
    private callbackTable = {};

    constructor() {
    }

    public requestInitData(callback: CallableFunction) {
        callback({isGaming: false});
    }

    public requestPrepare(callback: CallableFunction) {
        callback();
        setTimeout(() => {
            this.callbackTable["start"]();
        });
    }

    public registerStart(callback: CallableFunction) {
        this.callbackTable["start"] = callback;
    }
}
