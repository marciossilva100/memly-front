// Lista de termos ofensivos por idioma, cobrindo os 15 idiomas suportados em src/locales.
// Não é exaustiva — cobre os termos mais comuns de cada idioma como uma primeira barreira.
const BLOCKED_WORDS = {
    pt: [
        "arrombado", "babaca", "boiola", "bosta", "buceta", "caralho", "corno",
        "desgraçado", "fdp", "foda-se", "fodase", "gonorreia", "krl", "merda",
        "otario", "otário", "piranha", "porra", "puta", "putaria", "puto",
        "retardado", "viado", "xoxota",
    ],
    en: [
        "asshole", "bastard", "bitch", "bullshit", "cunt", "faggot", "fuck",
        "motherfucker", "nigger", "nigga", "pussy", "retard", "shit", "slut", "whore",
    ],
    es: [
        "cabron", "cabrón", "coño", "gilipollas", "hijo de puta", "hijueputa",
        "imbecil", "imbécil", "joder", "maricon", "maricón", "mierda", "pendejo",
        "pinche", "puta", "puto", "verga", "zorra",
    ],
    fr: [
        "batard", "bâtard", "connard", "connasse", "encule", "enculé", "foutre",
        "merde", "nique ta mere", "nique ta mère", "pute", "putain", "salope",
    ],
    de: [
        "arschloch", "fotze", "hurensohn", "missgeburt", "mistkerl", "scheisse",
        "scheiße", "schlampe", "spast", "wichser",
    ],
    it: [
        "bastardo", "cazzo", "coglione", "merda", "puttana", "stronzo", "troia",
        "vaffanculo",
    ],
    ru: [
        "блять", "бля", "гандон", "ебать", "мудак", "пизда", "сука", "тварь",
        "хуй", "шлюха",
    ],
    ja: [
        "死ね", "馬鹿", "ばか", "くそ", "ちくしょう", "きちがい", "まんこ", "ちんこ",
        "ぶす", "カス",
    ],
    zh: [
        "傻逼", "操", "妈的", "狗屎", "婊子", "贱人", "混蛋", "王八蛋", "白痴", "死全家",
    ],
    ko: [
        "씨발", "개새끼", "병신", "좆", "미친놈", "걸레", "쓰레기", "개자식", "지랄",
    ],
    ar: [
        "كلب", "خرا", "عاهرة", "قحبة", "شرموطة", "منيك", "ابن كلب", "حقير",
    ],
    tr: [
        "amk", "aptal", "göt", "ibne", "kahpe", "orospu", "piç", "salak",
        "siktir", "yavşak",
    ],
    pl: [
        "chuj", "cipa", "dziwka", "gówno", "jebać", "kurwa", "pierdolić",
        "pizda", "skurwysyn", "spierdalaj",
    ],
    nl: [
        "eikel", "godverdomme", "hoer", "kanker", "klootzak", "klote", "kut",
        "lul", "sukkel", "tering",
    ],
    hi: [
        "चूतिया", "गांडू", "रंडी", "कमीना", "भोसड़ी", "हरामी", "हरामज़ादा",
    ],
};

// Idiomas sem separação por espaço entre palavras — busca por substring direta.
const SPACELESS_LANGUAGES = new Set(["zh", "ja"]);

const DIACRITIC_MAP = {
    á: "a", à: "a", â: "a", ã: "a", ä: "a", å: "a",
    é: "e", è: "e", ê: "e", ë: "e",
    í: "i", ì: "i", î: "i", ï: "i",
    ó: "o", ò: "o", ô: "o", õ: "o", ö: "o",
    ú: "u", ù: "u", û: "u", ü: "u",
    ç: "c", ñ: "n", ş: "s", ğ: "g", ı: "i", ő: "o", ű: "u",
    ł: "l", ż: "z", ź: "z", ą: "a", ę: "e", ć: "c", ń: "n", š: "s", č: "c", ž: "z",
};

const DIACRITIC_PATTERN = /[áàâãäåéèêëíìîïóòôõöúùûüçñşğıőűłżźąęćńšč]/gi;

function stripDiacritics(text) {
    return text.replace(DIACRITIC_PATTERN, (ch) => DIACRITIC_MAP[ch.toLowerCase()] ?? ch);
}

function normalize(text) {
    return stripDiacritics(text).toLowerCase();
}

function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
}

const PATTERNS = Object.entries(BLOCKED_WORDS).flatMap(([lang, words]) => {
    const spaceless = SPACELESS_LANGUAGES.has(lang);

    return words.map((word) => {
        const escaped = escapeRegex(normalize(word));

        return spaceless
            ? new RegExp(escaped, "iu")
            : new RegExp(`(?<![\\p{L}\\p{N}])${escaped}(?![\\p{L}\\p{N}])`, "iu");
    });
});

export function containsProfanity(text) {
    if (!text) return false;

    const normalized = normalize(text);

    return PATTERNS.some((pattern) => pattern.test(normalized));
}
