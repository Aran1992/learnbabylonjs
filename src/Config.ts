export default {
    fps: 60,
    openCupDuration: 1000,
    diceDisappearAnimation: {
        twinkTimes: 3,
        duration: 1000,
    },
    bgImagePath: "assets/image/bg.jpg",
    uiXMLPath: "assets/layout/ui.xml",
    pointImagePath: "assets/image/yyl_ludan_${point}.png",
    startAnimationDuration: 1000,
    rollAnimationDuration: 1000,
    eliminateDuration: 2000,
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
            {point: 4, position: [1, 0, 0], rotation: [0, 0, Math.PI / 2,],},
            {point: 3, position: [-1, 0, 0], rotation: [0, 0, -Math.PI / 2,],},
            {point: 5, position: [0, 1, 0], rotation: [0, 0, 0,]},
            {point: 1, position: [0, -1, 0], rotation: [Math.PI, 0, 0,],},
            {point: 2, position: [0, 0, 1], rotation: [-Math.PI / 2, 0, 0,],},
            {point: 6, position: [0, 0, -1], rotation: [Math.PI / 2, 0, 0,],},
        ],
    },
    cups: [
        [0, -7],
        [9, -3],
        [5, -0.5],
        [0, 1],
        [-5, -0.5],
        [-9, -3],
    ],
};
