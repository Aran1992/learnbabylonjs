export default class EventMgr {
    private eventTable = {};

    public register(event: string, handler: CallableFunction) {
        if (this.eventTable[event] === undefined) {
            this.eventTable[event] = [];
        }
        this.eventTable[event].push(handler);
    }

    public unregister(event: string, handler: CallableFunction) {
        const list = this.eventTable[event];
        if (list) {
            const index = list.indexOf(handler);
            if (index !== -1) {
                list.splice(index, 1);
            }
        }
    }

    public notify(event: string, ...args) {
        const list = this.eventTable[event];
        if (list) {
            list.forEach(handler => handler(...args));
        }
    }
}
