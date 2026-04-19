// ============================================================
// keyboard-lessons.js
// Stage definitions for Хурууны байрлал mode.
// Each stage has: id, lesson (title), keys (char array)
// ============================================================

window.keyboardLessons = [
    {
        id: 1,
        lesson: "1-р шат",
        keys: ["й", "ы", "б", "ө", "р", "о", "л", "д"]
    },
    {
        id: 2,
        lesson: "2-р шат",
        keys: ["ф", "ц", "у", "ж", "г", "ш", "ү", "з"]
    },
    {
        id: 3,
        lesson: "3-р шат",
        keys: ["я", "ч", "ё", "с", "т", "ь", "в", "ю"]
    },
    {
        id: 4,
        lesson: "4-р шат",
        keys: ["э", "н", "а", "х", "м", "и"]
    },
    {
        id: 5,
        lesson: "5-р шат",
        keys: ["п", "к", "ъ", "е", "щ"]
    },
    {
        id: 6,
        lesson: "6-р шат",
        keys: ["ф", "ц", "у", "ж", "г", "ш", "ү", "з", "й", "ы", "б", "ө", "р", "о", "л", "д", "я", "ч", "ё", "с", "т", "ь", "в", "ю"]
    },
    {
        id: 7,
        lesson: "7-р шат",
        keys: ["ф", "ц", "у", "ж", "э", "н", "г", "ш", "ү", "з", "й", "ы", "б", "ө", "а", "х", "р", "о", "л", "я", "ч", "ё", "с", "м", "и", "т", "ь", "в", "ю"]
    },
    {
        id: 8,
        lesson: "8-р шат",
        keys: ["е", "щ", "ф", "ц", "у", "ж", "э", "н", "г", "ш", "ү", "з", "к", "ъ", "й", "ы", "б", "ө", "а", "х", "р", "о", "л", "д", "п", "я", "ч", "ё", "с", "м", "и", "т", "ь", "в", "ю"]
    }
];

// ============================================================
// Mongolian Cyrillic keyboard layout (QWERTY-mapped)
// rows: top(number), upper, home, lower
// Each key: { label, char(s) }
// ============================================================
window.kbLayout = [
    // Number row (decorative, not used in stages)
    ["ё", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="],
    // Upper row
    ["й", "ц", "у", "к", "е", "н", "г", "ш", "ү", "з", "х", "ъ"],
    // Home row
    ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
    // Lower row
    ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю", "щ"]
];

// char → { row, col } position in kbLayout (rows 1-3 only, 0-indexed)
window.kbCharPos = {};
(function buildCharPos() {
    for (let r = 1; r <= 3; r++) {
        for (let c = 0; c < window.kbLayout[r].length; c++) {
            const ch = window.kbLayout[r][c].toLowerCase();
            window.kbCharPos[ch] = { row: r, col: c };
        }
    }
})();

// ============================================================
// Finger assignment for each key position.
// Finger IDs: L1=left-pinky, L2=left-ring, L3=left-middle, L4=left-index
//             R1=right-index, R2=right-middle, R3=right-ring, R4=right-pinky
// ============================================================
window.kbFingerMap = {
    // Upper row (row=1): й ц у к е н г ш ү з х ъ
    "1-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },
    "1-1":  { hand: "left",  finger: 3, name: "Зүүн гарын хонхор" },
    "1-2":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },
    "1-3":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "1-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "1-5":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "1-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "1-7":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "1-8":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "1-9":  { hand: "right", finger: 3, name: "Баруун гарын хонхор" },
    "1-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },
    "1-11": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },
    // Home row (row=2): ф ы в а п р о л д ж э
    "2-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },
    "2-1":  { hand: "left",  finger: 3, name: "Зүүн гарын хонхор" },
    "2-2":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },
    "2-3":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "2-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "2-5":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "2-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "2-7":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "2-8":  { hand: "right", finger: 3, name: "Баруун гарын хонхор" },
    "2-9":  { hand: "right", finger: 3, name: "Баруун гарын хонхор" },
    "2-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" },
    // Lower row (row=3): я ч с м и т ь б ю щ
    "3-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },
    "3-1":  { hand: "left",  finger: 3, name: "Зүүн гарын хонхор" },
    "3-2":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },
    "3-3":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "3-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" },
    "3-5":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "3-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },
    "3-7":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },
    "3-8":  { hand: "right", finger: 3, name: "Баруун гарын хонхор" },
    "3-9":  { hand: "right", finger: 4, name: "Баруун гарын чигчий" }
};
