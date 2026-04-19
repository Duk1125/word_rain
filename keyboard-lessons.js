// ============================================================
// keyboard-lessons.js
// Stage definitions + keyboard layout/finger mapping data
// for Хурууны байрлал mode.
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
// Standard Mongolian Cyrillic keyboard layout
//
// Row indices:
//   0 = number row  (ё 1 2 3 4 5 6 7 8 9 0 - =)
//   1 = upper row   (й ц у к е н г ш ү з х ъ)
//   2 = home row    (ф ы в а п р о л д ж э)
//   3 = lower row   (я ч с м и т ь б ю щ)
//
// Special keys (Shift) are handled separately.
// ============================================================
window.kbLayout = [
    // Row 0 – number row (shown but not part of finger assignment)
    ["ё", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "–", "="],
    // Row 1 – upper row
    ["й", "ц", "у", "к", "е", "н", "г", "ш", "ү", "з", "х", "ъ"],
    // Row 2 – home row
    ["ф", "ы", "в", "а", "п", "р", "о", "л", "д", "ж", "э"],
    // Row 3 – lower row
    ["я", "ч", "с", "м", "и", "т", "ь", "б", "ю", "щ"]
];

// ── Auto-build char → position lookup ────────────────────────
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
// Finger assignment
// Finger numbers:
//   1 = долоовор (index)
//   2 = дунд     (middle)
//   3 = ядам     (ring)    ← was "хонхор", corrected to "Ядам"
//   4 = чигчий   (pinky)
//
// hand: "left" | "right"
// ============================================================
window.kbFingerMap = {
    // ── Row 1 (upper): й ц у к е н г ш ү з х ъ ──────────────
    //  idx: 0  1  2  3  4  5  6  7  8  9 10 11
    "1-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },   // й
    "1-1":  { hand: "left",  finger: 3, name: "Зүүн гарын ядам" },     // ц
    "1-2":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },     // у
    "1-3":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" }, // к
    "1-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" }, // е
    "1-5":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },// н
    "1-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },// г
    "1-7":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },   // ш
    "1-8":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },   // ү
    "1-9":  { hand: "right", finger: 3, name: "Баруун гарын ядам" },   // з
    "1-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" }, // х
    "1-11": { hand: "right", finger: 4, name: "Баруун гарын чигчий" }, // ъ

    // ── Row 2 (home): ф ы в а п р о л д ж э ─────────────────
    //  idx: 0  1  2  3  4  5  6  7  8  9 10
    "2-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },   // ф
    "2-1":  { hand: "left",  finger: 3, name: "Зүүн гарын ядам" },     // ы
    "2-2":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },     // в
    "2-3":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" }, // а
    "2-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" }, // п
    "2-5":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },// р
    "2-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },// о
    "2-7":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },   // л
    "2-8":  { hand: "right", finger: 3, name: "Баруун гарын ядам" },   // д
    "2-9":  { hand: "right", finger: 3, name: "Баруун гарын ядам" },   // ж  ← ядам stretches
    "2-10": { hand: "right", finger: 4, name: "Баруун гарын чигчий" }, // э

    // ── Row 3 (lower): я ч с м и т ь б ю щ ──────────────────
    //  idx: 0  1  2  3  4  5  6  7  8  9
    "3-0":  { hand: "left",  finger: 4, name: "Зүүн гарын чигчий" },   // я
    "3-1":  { hand: "left",  finger: 3, name: "Зүүн гарын ядам" },     // ч
    "3-2":  { hand: "left",  finger: 2, name: "Зүүн гарын дунд" },     // с
    "3-3":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" }, // м
    "3-4":  { hand: "left",  finger: 1, name: "Зүүн гарын долоовор" }, // и
    "3-5":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },// т
    "3-6":  { hand: "right", finger: 1, name: "Баруун гарын долоовор" },// ь
    "3-7":  { hand: "right", finger: 2, name: "Баруун гарын дунд" },   // б
    "3-8":  { hand: "right", finger: 3, name: "Баруун гарын ядам" },   // ю
    "3-9":  { hand: "right", finger: 4, name: "Баруун гарын чигчий" }  // щ
};
