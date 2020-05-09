import {Rectangle} from "babylonjs-gui/2D/controls/rectangle";
import {Control, XmlLoader} from "babylonjs-gui";
import {Button} from "babylonjs-gui/2D/controls/button";
import SoundMgr from "./SoundMgr";
import Util from "./Util";

export default class SettingPanel {
    private xmlLoader: XmlLoader;
    private root: Rectangle;
    private closeSettingBtn: Button;
    private closeMusicBtn: Button;
    private openMusicBtn: Button;
    private closeSoundBtn: Button;
    private openSoundBtn: Button;

    constructor(xmlLoader: XmlLoader) {
        this.xmlLoader = xmlLoader;
        this.root = this.xmlLoader.getNodeById("settingPanel");
        this.closeSettingBtn = this.xmlLoader.getNodeById("closeSettingBtn");
        Util.onClick(this.closeSettingBtn, this.onClickCloseSettingBtn.bind(this));
        this.closeMusicBtn = this.xmlLoader.getNodeById("closeMusicBtn");
        Util.onClick(this.closeMusicBtn, this.closeMusicBtnClick.bind(this));
        this.openMusicBtn = this.xmlLoader.getNodeById("openMusicBtn");
        Util.onClick(this.openMusicBtn, this.openMusicBtnClick.bind(this));
        this.closeSoundBtn = this.xmlLoader.getNodeById("closeSoundBtn");
        Util.onClick(this.closeSoundBtn, this.closeSoundBtnClick.bind(this));
        this.openSoundBtn = this.xmlLoader.getNodeById("openSoundBtn");
        Util.onClick(this.openSoundBtn, this.openSoundBtnClick.bind(this));
        this.refresh();
    }

    public set isVisible(visible: boolean) {
        this.root.isVisible = visible;
    }

    private onClickCloseSettingBtn() {
        this.isVisible = false;
    }

    private closeMusicBtnClick() {
        SoundMgr.closeMusic();
        this.refresh();
    }

    private openMusicBtnClick() {
        SoundMgr.openMusic();
        this.refresh();
    }

    private closeSoundBtnClick() {
        SoundMgr.closeSound();
        this.refresh();
    }

    private openSoundBtnClick() {
        SoundMgr.openSound();
        this.refresh();
    }

    private refresh() {
        if (SoundMgr.isMusicOpen) {
            this.openMusicBtn.isVisible = false;
            this.closeMusicBtn.isVisible = true;
        } else {
            this.openMusicBtn.isVisible = true;
            this.closeMusicBtn.isVisible = false;
        }
        if (SoundMgr.isSoundOpen) {
            this.openSoundBtn.isVisible = false;
            this.closeSoundBtn.isVisible = true;
        } else {
            this.openSoundBtn.isVisible = true;
            this.closeSoundBtn.isVisible = false;
        }
    }

    private onClick(button: Control, callback) {
        button.onPointerUpObservable.add(callback);
    }
}
