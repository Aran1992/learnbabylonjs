import GameScene from "./GameScene";
import GUI from "./GUI";

class GameMgr {
    private gameScene: GameScene;
    private gui: GUI;

    constructor() {
        this.gameScene = new GameScene();
        this.gui = new GUI();
    }
}

new GameMgr();
