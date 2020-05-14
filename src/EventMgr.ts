import {Event} from "./Event";

class EventMgr_ {
    private eventTable = {};

    public register(event: Event, handler: CallableFunction) {
        if (this.eventTable[event] === undefined) {
            this.eventTable[event] = [];
        }
        this.eventTable[event].push(handler);
    }

    public unregister(event: Event, handler: CallableFunction) {
        const list = this.eventTable[event];
        if (list) {
            const index = list.indexOf(handler);
            if (index !== -1) {
                list.splice(index, 1);
            }
        }
    }

    public notify(event: Event, ...args) {
        console.log("EventMgr.notify", Event[event], ...args);
        const list = this.eventTable[event];
        if (list) {
            list.forEach(handler => handler(...args));
        }
    }
}

const EventMgr = new EventMgr_();
export default EventMgr;
