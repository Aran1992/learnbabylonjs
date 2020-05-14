import DataMgr from "./DataMgr";
import View from "./View";

class Main {
    private dataMgr: DataMgr;
    private view: View;

    constructor() {
        this.dataMgr = new DataMgr();
        this.dataMgr.init();
        this.view = new View(this.dataMgr);
        this.view.init();
    }
}

new Main();
