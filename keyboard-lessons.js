// ============================================================
// keyboard-lessons.js
// Stage definitions + correct Mongolian Cyrillic keyboard
// layout (MNS standard) + finger mapping + finger colors
// ============================================================

window.keyboardLessons = [
    { id: 1, lesson: "1-р шат", keys: ["й", "ы", "б", "ő", "р", "о", "л", "д"] },
    { id: 2, lesson: "2-р шат", keys: ["ф", "ц", "у", "ж", "г", "ш", "ү", "з"] },
    { id: 3, lesson: "3-р шат", keys: ["я", "ч", "ё", "с", "т", "ь", "в", "ю"] },
    { id: 4, lesson: "4-р шат", keys: ["э", "н", "а", "х", "м", "и"] },
    { id: 5, lesson: "5-р шат", keys: ["п", "к", "ъ", "е", "щ"] },
    {
        id: 6, lesson: "6-р шат",
        keys: ["ф","ц","у","ж","г","ш","ү","з","й","ы","б","ő","р","о","л","д","я","ч","ё","с","т","ь","в","ю"]
    },
    {
        id: 7, lesson: "7-р шат",
        keys: ["ф","ц","у","ж","э","н","г","ш","ү","з","й","ы","б","ő","а","х","р","о","л","я","ч","ё","с","м","и","т","ь","в","ю"]
    },
    {
        id: 8, lesson: "8-р шат",
        keys: ["е","щ","ф","ц","у","ж","э","н","г","ш","ű","з","к","ъ","й","ы","б","ő","а","х","р","о","л","д","п","я","ч","ё","с","м","и","т","ь","в","ю"]
    }
];

// ============================================================
// Mongolian Cyrillic keyboard layout — MNS standard
//
//  Row 0 – symbol row:  = № – " ₮ : . _ , % ? е щ
//  Row 1 – upper row:   ф ц у ж э н г ш ű з к ъ
//  Row 2 – home row:    й ы б ő а х р о л д п
//  Row 3 – lower row:   я ч ё с м и т ь в ю
// ============================================================
window.kbLayout = [
    ["=", "№", "–", "\"", "₮", ":", ".", "_", ",", "%", "?", "е", "щ"],
    ["ф", "ц", "у", "ж", "э", "н", "г", "ш", "ű", "з", "к", "ъ"],
    ["й", "ы", "б", "ő", "а", "х", "р", "о", "л", "д", "п"],
    ["я", "ч", "ё", "с", "м", "и", "т", "ь", "в", "ю"]
];

// Auto-build char → {row, col}
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
//  1 = долоовор (index)   → Yellow
//  2 = дунд     (middle)  → Green
//  3 = ядам     (ring)    → Red
//  4 = чигчий   (pinky)   → Blue
//
//  NOTE: е (0-11), щ (0-12) are PINKY (4) / Blue
//        Both Shift keys are PINKY (4) / Blue
// ============================================================
window.kbFingerMap = {
    // Row 0 – symbol row
    "0-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },
    "0-1":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },
    "0-2":  { hand: "left",  finger: 3, name: "Зүүн гарын ядам" },
    "0-3":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },
    "0-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "0-5":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "0-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "0-7":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "0-8":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "0-9":  { hand: "right", finger: 3, name: "Баруун гарын ядам" },
    "0-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },
    "0-11": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },  // е  ← чигчий/blue
    "0-12": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },  // щ  ← чигчий/blue

    // Row 1 – upper: ф ц у ж э | н г ш ű з к ъ
    "1-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },
    "1-1":  { hand: "left",  finger: 3, name: "Зүүн гарын ядам" },
    "1-2":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },
    "1-3":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "1-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "1-5":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "1-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "1-7":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "1-8":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "1-9":  { hand: "right", finger: 3, name: "Баруун гарын ядам" },
    "1-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },
    "1-11": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },

    // Row 2 – home: й ы б ő а | х р о л д п
    "2-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },
    "2-1":  { hand: "left",  finger: 3, name: "Зүүн гарын ядам" },
    "2-2":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },
    "2-3":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "2-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "2-5":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "2-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "2-7":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "2-8":  { hand: "right", finger: 3, name: "Баруун гарын ядам" },
    "2-9":  { hand: "right", finger: 3, name: "Баруун гарын ядам" },
    "2-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },

    // Row 3 – lower: я ч ё с м | и т ь в ю
    "3-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },
    "3-1":  { hand: "left",  finger: 3, name: "Зүүн гарын ядам" },
    "3-2":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },
    "3-3":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "3-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "3-5":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "3-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "3-7":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "3-8":  { hand: "right", finger: 3, name: "Баруун гарын ядам" },
    "3-9":  { hand: "right", finger: 4, name: "Баруун гарын чигчий" }
};

// ============================================================
// Finger color palette
//  1 = долоовор → Yellow  (#f5c400)
//  2 = дунд     → Green   (#2ecc6e)
//  3 = ядам     → Red     (#ff4f4f)
//  4 = чигчий   → Blue    (#4a8fff)   ← also Shift, е, щ
// ============================================================
window.FINGER_COLORS = {
    1: {
        bg: '#f5c400', border: '#f5c400', text: '#1a1500', label: '#f5c400',
        subtle: 'rgba(245,196,0,0.16)', subtleBorder: 'rgba(245,196,0,0.42)'
    },
    2: {
        bg: '#2ecc6e', border: '#2ecc6e', text: '#001a08', label: '#2ecc6e',
        subtle: 'rgba(46,204,110,0.16)', subtleBorder: 'rgba(46,204,110,0.42)'
    },
    3: {
        bg: '#ff4f4f', border: '#ff4f4f', text: '#1a0000', label: '#ff7070',
        subtle: 'rgba(255,79,79,0.16)', subtleBorder: 'rgba(255,79,79,0.42)'
    },
    4: {
        bg: '#4a8fff', border: '#4a8fff', text: '#00001a', label: '#4a8fff',
        subtle: 'rgba(74,143,255,0.16)', subtleBorder: 'rgba(74,143,255,0.42)'
    }
};
