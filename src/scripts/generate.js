// generate.js — крипто-стойкая генерация паролей (Web Crypto API)

const CHAR_UPPER = 'QWERTYUIOPASDFGHJKLZXCVBNM';
const CHAR_LOWER = 'qwertyuiopasdfghjklzxcvbnm';
const CHAR_NUM   = '1234567890';
const CHAR_SPEC  = '!@#$%^&*?_~-+=()[]{}<>.,:;';
// Кириллица для локальных сервисов
const CHAR_UPPER_CYR = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
const CHAR_LOWER_CYR = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя';

// Криптостойкий целое в диапазоне [0, max) без modulo bias
function secureRandomInt(max) {
    // eslint-disable-next-line no-undef
    const c = (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function')
        ? crypto
        : null;

    if (c) {
        const buf = new Uint32Array(1);
        const limit = Math.floor(0xffffffff / max) * max; // rejection sampling
        let x;
        do {
            c.getRandomValues(buf);
            x = buf[0];
        } while (x >= limit);
        return x % max;
    }

    // Фолбэк для окружений без Web Crypto (например, jsdom в тестах)
    return Math.floor(Math.random() * max);
}

function pick(str) {
    return str[secureRandomInt(str.length)];
}

function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
        const j = secureRandomInt(i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}

export function getCharSets(options) {
    const sets = [];
    if (options.useUpper) sets.push(CHAR_UPPER);
    if (options.useLower) sets.push(CHAR_LOWER);
    if (options.useNumbers) sets.push(CHAR_NUM);
    if (options.useSymbols) sets.push(CHAR_SPEC);
    if (options.useCyrillicUpper) sets.push(CHAR_UPPER_CYR);
    if (options.useCyrillicLower) sets.push(CHAR_LOWER_CYR);
    return sets;
}

/**
 * Генерация пароля.
 * options: { useUpper, useLower, useNumbers, useSymbols,
 *            useCyrillicUpper, useCyrillicLower, excludeAmbiguous }
 */
export function generatePassword(length = 12, options = {}) {
    const { excludeAmbiguous = false } = options;

    let sets = getCharSets(options);

    if (excludeAmbiguous) {
        const AMBIGUOUS = /[lI1O0o|`'".,:;_~]/g;
        sets = sets.map((s) => s.replace(AMBIGUOUS, ''));
    }

    const nonEmpty = sets.filter((s) => s.length > 0);
    if (nonEmpty.length === 0) return '';

    const pool = nonEmpty.join('');
    const finalLength = Math.max(length, nonEmpty.length);

    // По одному обязательному символу из каждого выбранного набора
    const chars = nonEmpty.map((s) => pick(s));

    // Добор остальных символов из общего пула
    while (chars.length < finalLength) {
        chars.push(pick(pool));
    }

    return shuffle(chars).join('');
}

// ===== Шаблоны (пресеты наборов символов) =====
export const TEMPLATES = {
    full: {
        label: 'Надёжный (буквы+цифры+спецсимволы)',
        options: { useUpper: true, useLower: true, useNumbers: true, useSymbols: true },
    },
    alphanumeric: {
        label: 'Буквы и цифры (без спецсимволов)',
        options: { useUpper: true, useLower: true, useNumbers: true, useSymbols: false },
    },
    simple: {
        label: 'Только строчные и цифры',
        options: { useUpper: false, useLower: true, useNumbers: true, useSymbols: false },
    },
    cyrillic: {
        label: 'Кириллица (для локальных сервисов)',
        options: {
            useUpper: false, useLower: false, useNumbers: true, useSymbols: false,
            useCyrillicUpper: true, useCyrillicLower: true,
        },
    },
};

const ALL_OFF = {
    useUpper: false, useLower: false, useNumbers: false, useSymbols: false,
    useCyrillicUpper: false, useCyrillicLower: false,
};

export function applyTemplate(templateKey, currentOptions) {
    const t = TEMPLATES[templateKey];
    if (!t) return currentOptions;
    return { ...currentOptions, ...ALL_OFF, ...t.options };
}

export function detectTemplate(options) {
    for (const key of Object.keys(TEMPLATES)) {
        const merged = { ...ALL_OFF, ...TEMPLATES[key].options };
        const cur = { ...ALL_OFF, ...options };
        if (Object.keys(merged).every((k) => merged[k] === cur[k])) return key;
    }
    return 'custom';
}
