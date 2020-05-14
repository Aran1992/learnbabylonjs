export default {
    ip: "192.168.18.80",
    // ip: "111.229.243.99",
    maxRound: 3,
    callThreeRound: 3,
    maxSelectPoint: 2,
    maxChoosePoint: 3,
    fps: 60,
    openCupDuration: 1000,
    diceDisappearAnimation: {
        twinkTimes: 3,
        duration: 1000,
    },
    bgImagePath: "assets/image/bg.jpg",
    uiXMLPath: "assets/layout/ui.xml",
    pointImagePath: "assets/image/yyl_ludan_${point}.png",
    decideReadyDuration: 5000,
    startAnimationDuration: 1000,
    rollAnimationDuration: 1000,
    decideCallDuration: 10000,
    eliminateDuration: 3000,
    designWidth: 1280,
    designHeight: 720,
    camera: {
        pos: [0, 12, -12],
        target: [0, 0, -4]
    },
    friction: 0.1,
    restitution: 0.1,
    cup: {
        initCount: 6,
        texturePath: "assets/image/bg.png",
        height: 3,
        diameter: 3,
        thickness: 0.1,
        tessellation: 8,
        position: [0, -3, 0],
        scale: 60,
        dices: {
            6: [
                [0.6, 0.7],
                [-0.6, 0.7],
                [0.6, 0],
                [-0.6, 0],
                [0.6, -0.7],
                [-0.6, -0.7],
            ],
            5: [
                [0, 0],
                [0.75, 0],
                [-0.75, 0],
                [0, 0.75],
                [0, -0.75],
            ],
            4: [
                [0.75, 0],
                [-0.75, 0],
                [0, 0.75],
                [0, -0.75],
            ],
            3: [
                [-0.75, 0],
                [0, 0.75],
                [0, -0.75],
            ],
            2: [
                [0, 0.75],
                [0, -0.75],
            ],
            1: [
                [0, 0],
            ],
            0: [],
        },
    },
    dice: {
        size: 0.5,
        modelSize: 0.005875,
        scale: 0.5 / 0.005875,
        sides: [
            {point: 5, position: [0, 1, 0], rotation: [0, 0, 0,]},
            {point: 4, position: [1, 0, 0], rotation: [0, 0, Math.PI / 2,],},
            {point: 3, position: [-1, 0, 0], rotation: [0, 0, -Math.PI / 2,],},
            {point: 1, position: [0, -1, 0], rotation: [Math.PI, 0, 0,],},
            {point: 2, position: [0, 0, 1], rotation: [-Math.PI / 2, 0, 0,],},
            {point: 6, position: [0, 0, -1], rotation: [Math.PI / 2, 0, 0,],},
        ],
    },
    cups: [
        [0, -7],
        [9.5, -2],
        [5, -0.5],
        [0, 0.5],
        [-5, -0.5],
        [-9.5, -2],
    ],
    audioResTable: {
        bgm: "assets/sound/yaoyaole_bgm.mp3",
        click: "assets/sound/yaoyaole_click.mp3",
        lose: "assets/sound/yaoyaole_end_lose.mp3",
        win: "assets/sound/yaoyaole_end_win.mp3",
        shake: "assets/sound/yaoyaole_shake_dice.mp3",
    },
    meshNameList: ["touzi", "shaizhong", "shaizhong2"],
    myPlayerInfoPanel: {
        frameImage: {source: "assets/image/my_frame.png"},
        nameText: {fontSize: 24, top: -20},
        moneyIcon: {width: 54, height: 52, top: 20, left: -75},
        moneyText: {fontSize: 24, top: 20},
        readyIcon: {top: -100},
        thinkingIcon: {top: -80},
        dicesPanel: {top: 0, left: 250},
    },
    otherPlayerInfoPanel: {
        frameImage: {source: "assets/image/other_frame.png"},
        nameText: {fontSize: 22, top: -18},
        moneyIcon: {width: 36, height: 35, top: 18, left: -50},
        moneyText: {fontSize: 22, top: 18},
        readyIcon: {top: 75},
        thinkingIcon: {top: -60},
        dicesPanel: {top: 120, left: 0},
    },
};
