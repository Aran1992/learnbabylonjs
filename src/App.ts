import DataMgr from "./DataMgr";
import View from "./View";

// todo 全局的错误捕获 上报
window.onerror = (...args) => {
    console.log(...args);
    alert(args);
};

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
