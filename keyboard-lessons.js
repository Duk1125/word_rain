// ============================================================
// keyboard-lessons.js
// Stage definitions + correct Mongolian Cyrillic keyboard
// layout (MNS standard) + finger mapping + finger colors
// ============================================================

window.keyboardLessons = [
    { id: 1, lesson: "1-р шат", keys: ["й", "ы", "б", "ө", "р", "о", "л", "д"] },
    { id: 2, lesson: "2-р шат", keys: ["ф", "ц", "у", "ж", "г", "ш", "ү", "з"] },
    { id: 3, lesson: "3-р шат", keys: ["я", "ч", "ё", "с", "т", "ь", "в", "ю"] },
    { id: 4, lesson: "4-р шат", keys: ["э", "н", "а", "х", "м", "и"] },
    { id: 5, lesson: "5-р шат", keys: ["п", "к", "ъ", "е", "щ"] },
    {
        id: 6, lesson: "6-р шат",
        keys: ["ф", "ц", "у", "ж", "г", "ш", "ү", "з", "й", "ы", "б", "ө", "р", "о", "л", "д", "я", "ч", "ё", "с", "т", "ь", "в", "ю"]
    },
    {
        id: 7, lesson: "7-р шат",
        keys: ["ф", "ц", "у", "ж", "э", "н", "г", "ш", "ү", "з", "й", "ы", "б", "ө", "а", "х", "р", "о", "л", "я", "ч", "ё", "с", "м", "и", "т", "ь", "в", "ю"]
    },
    {
        id: 8, lesson: "8-р шат",
        keys: ["е", "щ", "ф", "ц", "у", "ж", "э", "н", "г", "ш", "ү", "з", "к", "ъ", "й", "ы", "б", "ө", "а", "х", "р", "о", "л", "д", "п", "я", "ч", "ё", "с", "м", "и", "т", "ь", "в", "ю"]
    }
];

// ============================================================
// Mongolian Cyrillic keyboard layout — MNS standard
//
//  Row 0 – symbol row:  = № – " ₮ : . _ , % ? е щ
//  Row 1 – upper row:   ф ц у ж э н г ш ү з к ъ
//  Row 2 – home row:    й ы б ө а х р о л д п
//  Row 3 – lower row:   я ч ё с м и т ь в ю
//
// Left Shift / Right Shift are injected by renderKeyboard().
// ============================================================
window.kbLayout = [
    // Row 0 – symbol row
    ["=", "№", "–", "\"", "₮", ":", ".", "_", ",", "%", "?", "е", "щ"],
    // Row 1 – upper row
    ["ф", "ц", "у", "ж", "э", "н", "г", "ш", "ү", "з", "к", "ъ"],
    // Row 2 – home row
    ["й", "ы", "б", "ө", "а", "х", "р", "о", "л", "д", "п"],
    // Row 3 – lower row
    ["я", "ч", "ё", "с", "м", "и", "т", "ь", "в", "ю"]
];

// ── Auto-build char → {row, col} lookup ──────────────────────
window.kbCharPos = {};
(function buildCharPos() {
    for (let r = 0; r <= 3; r++) {
        for (let c = 0; c < window.kbLayout[r].length; c++) {
            const ch = window.kbLayout[r][c].toLowerCase();
            window.kbCharPos[ch] = { row: r, col: c };
        }
    }
})();

// ============================================================
// Finger assignment
//  Finger numbers:
//    1 = долоовор (index)
//    2 = дунд     (middle)
//    3 = ядам     (ring)
//    4 = чигчий   (pinky)
// ============================================================
window.kbFingerMap = {
    // ── Row 0 symbol keys (only е/щ matter for stages) ──
    "0-0": { hand: "left", finger: 4, name: "Зүүн гарын чигчий" },
    "0-1": { hand: "left", finger: 4, name: "Зүүн гарын чигчий" },
    "0-2": { hand: "left", finger: 3, name: "Зүүн гарын ядам" },
    "0-3": { hand: "left", finger: 2, name: "Зүүн гарын дунд" },
    "0-4": { hand: "left", finger: 1, name: "Зүүн гарын долоовор" },
    "0-5": { hand: "left", finger: 1, name: "Зүүн гарын долоовор" },
    "0-6": { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "0-7": { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "0-8": { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "0-9": { hand: "right", finger: 3, name: "Баруун гарын ядам" },
    "0-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },
    "0-11": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },   // е
    "0-12": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },   // щ

    // ── Row 1 upper: ф ц у ж э | н г ш ү з к ъ ─────────
    "1-0": { hand: "left", finger: 4, name: "Зүүн гарын чигчий" },     // ф
    "1-1": { hand: "left", finger: 3, name: "Зүүн гарын ядам" },       // ц
    "1-2": { hand: "left", finger: 2, name: "Зүүн гарын дунд" },       // у
    "1-3": { hand: "left", finger: 1, name: "Зүүн гарын долоовор" },   // ж
    "1-4": { hand: "left", finger: 1, name: "Зүүн гарын долоовор" },   // э
    "1-5": { hand: "right", finger: 1, name: "Баруун гарын долоовор" }, // н
    "1-6": { hand: "right", finger: 1, name: "Баруун гарын долоовор" }, // г
    "1-7": { hand: "right", finger: 2, name: "Баруун гарын дунд" },     // ш
    "1-8": { hand: "right", finger: 2, name: "Баруун гарын ядам" },     // ү
    "1-9": { hand: "right", finger: 3, name: "Баруун гарын чигчий" },   // з
    "1-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },   // к
    "1-11": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },   // ъ

    // ── Row 2 home: й ы б ө а | х р о л д п ────────────
    "2-0": { hand: "left", finger: 4, name: "Зүүн гарын чигчий" },     // й
    "2-1": { hand: "left", finger: 3, name: "Зүүн гарын ядам" },       // ы
    "2-2": { hand: "left", finger: 2, name: "Зүүн гарын дунд" },       // б
    "2-3": { hand: "left", finger: 1, name: "Зүүн гарын долоовор" },   // ө
    "2-4": { hand: "left", finger: 1, name: "Зүүн гарын долоовор" },   // а
    "2-5": { hand: "right", finger: 1, name: "Баруун гарын долоовор" }, // х
    "2-6": { hand: "right", finger: 1, name: "Баруун гарын долоовор" }, // р
    "2-7": { hand: "right", finger: 2, name: "Баруун гарын дунд" },     // о
    "2-8": { hand: "right", finger: 3, name: "Баруун гарын ядам" },     // л
    "2-9": { hand: "right", finger: 3, name: "Баруун гарын чигчий" },   // д
    "2-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },   // п

    // ── Row 3 lower: я ч ё с м | и т ь в ю ─────────────
    "3-0": { hand: "left", finger: 4, name: "Зүүн гарын чигчий" },    // я
    "3-1": { hand: "left", finger: 3, name: "Зүүн гарын ядам" },       // ч
    "3-2": { hand: "left", finger: 2, name: "Зүүн гарын дунд" },       // ё
    "3-3": { hand: "left", finger: 1, name: "Зүүн гарын долоовор" },   // с
    "3-4": { hand: "left", finger: 1, name: "Зүүн гарын долоовор" },   // м
    "3-5": { hand: "right", finger: 1, name: "Баруун гарын долоовор" }, // и
    "3-6": { hand: "right", finger: 1, name: "Баруун гарын долоовор" }, // т
    "3-7": { hand: "right", finger: 2, name: "Баруун гарын дунд" },     // ь
    "3-8": { hand: "right", finger: 3, name: "Баруун гарын ядам" },     // в
    "3-9": { hand: "right", finger: 4, name: "Баруун гарын чигчий" }    // ю
};

// ============================================================
// Finger color palette
//  1 = долоовор → Yellow
//  2 = дунд     → Green
//  3 = ядам     → Red
//  4 = чигчий   → Blue
// ============================================================
window.FINGER_COLORS = {
    1: {
        bg: '#f5c400',
        border: '#f5c400',
        text: '#1a1500',
        label: '#f5c400',
        subtle: 'rgba(245,196,0,0.15)',
        subtleBorder: 'rgba(245,196,0,0.38)'
    },
    2: {
        bg: '#2ecc6e',
        border: '#2ecc6e',
        text: '#001a08',
        label: '#2ecc6e',
        subtle: 'rgba(46,204,110,0.15)',
        subtleBorder: 'rgba(46,204,110,0.38)'
    },
    3: {
        bg: '#ff4f4f',
        border: '#ff4f4f',
        text: '#1a0000',
        label: '#ff7070',
        subtle: 'rgba(255,79,79,0.15)',
        subtleBorder: 'rgba(255,79,79,0.38)'
    },
    4: {
        bg: '#4a8fff',
        border: '#4a8fff',
        text: '#00001a',
        label: '#4a8fff',
        subtle: 'rgba(74,143,255,0.15)',
        subtleBorder: 'rgba(74,143,255,0.38)'
    }
};
