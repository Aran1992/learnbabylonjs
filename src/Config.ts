export default {
    bgImagePath: "assets/image/bg.jpg",
    uiXMLPath: "assets/layout/ui.xml",
    designWidth: 1280,
    designHeight: 720,
    friction: 0.1,
    restitution: 0.1,
    camera: {
        pos: [0, 12, -12],
        target: [0, 0, -4]
    },
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
            {point: 4, position: [1, 0, 0],},
            {point: 3, position: [-1, 0, 0],},
            {point: 5, position: [0, 1, 0],},
            {point: 1, position: [0, -1, 0],},
            {point: 2, position: [0, 0, 1],},
            {point: 6, position: [0, 0, -1],},
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
