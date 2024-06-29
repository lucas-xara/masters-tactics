import path from 'path';
import fs from 'fs'; 

const MODE = process.env.RENEWDATA_MODE || false;
let LANGUAGES_BASEDIR, EXTRA_BASEDIR;

if (MODE === 'hertz_wiki') {
    LANGUAGES_BASEDIR = 'feh-assets-json/files/assets/';
    EXTRA_BASEDIR = '/Message/Data/';
} else if (MODE === 'hackin_device') {
    LANGUAGES_BASEDIR = 'hackin/languages/';
    EXTRA_BASEDIR = '/';
} else {
    console.log('Invalid RENEWDATA_MODE environment variable, must be hertz_wiki or hackin_device');
    process.exit(1);
}

const blessed = JSON.parse(fs.readFileSync('fullother.json', 'utf-8')).blessed;

let languages = {
    "EUDE": {}, "EUES": {}, "USES": {}, "EUFR": {}, "EUIT": {}, "JPJA": {}, "TWZH": {}, "USEN": {}, "EUEN": {}, "USPT": {}
};

const basicstrings = ["MSID_H_NONE"];
const unitstrings = [
    "MID_HP", "MID_ATTACK", "MID_AGILITY", "MID_DEFENSE", "MID_RESIST", "MID_SKILL_POINT", "MID_HEROISM_POINT", "MID_LEVEL2", "MID_EXP", "MID_UNIT_INFO_EXP_MAX", "MID_UNIT_INFO_EXP_REMAIN",
    "MID_UNIT_INFO_TO_TALK", "MID_UNIT_INFO_TO_SKILLLEARN", "MID_UNIT_INFO_TO_SKILLEQUIP", "MID_UNIT_INFO_TO_SKILLSET"
];
const blessingstrings = [
    "MID_ITEM_BLESSING_FIRE", "MID_ITEM_BLESSING_WATER", "MID_ITEM_BLESSING_WIND", "MID_ITEM_BLESSING_EARTH", "MID_ITEM_BLESSING_LIGHT",
    "MID_ITEM_BLESSING_DARK", "MID_ITEM_BLESSING_HEAVEN", "MID_ITEM_BLESSING_LOGIC"
];
const aetherstrings = [
    "MID_SCF_砦", "MID_SCF_ギュミル水瓶", "MID_SCF_ギュミル泉", "MID_SCF_音楽堂", "MID_SCF_食堂", "MID_SCF_畑", "MID_SCF_宿屋", "MID_SCF_落雷の罠A",
    "MID_SCF_重圧の罠A", "MID_SCF_停止の罠A", "MID_SCF_落雷の罠ダミー", "MID_SCF_重圧の罠ダミー", "MID_SCF_停止の罠ダミー", "MID_SCF_対重装", "MID_SCF_雷",
    "MID_SCF_白封印祠", "MID_SCF_投石", "MID_SCF_対騎馬", "MID_SCF_黒封印祠", "MID_SCF_防比翼鳥籠", "MID_SCF_対飛行", "MID_SCF_回復", "MID_SCF_対歩行",
    "MID_SCF_恐慌", "MID_SCF_軍師"
];
const fullstrings = [...basicstrings, ...unitstrings, ...blessingstrings, ...aetherstrings];

for (let language in languages) {
    const files = fs.readdirSync(path.join(LANGUAGES_BASEDIR, language, EXTRA_BASEDIR));
    let strings = {};

    files.forEach(file => {
        const data = JSON.parse(fs.readFileSync(path.join(LANGUAGES_BASEDIR, language, EXTRA_BASEDIR, file), 'utf-8'));
        data.forEach(item => {
            if ((["MPID_", "MEID_", "MSID_"].some(sub => item.key.includes(sub)) && !["MPID_H_", "MEID_H_", "MSID_H_", "MPID_SEARCH_", "MSID_SEARCH_", "MPID_LEGEND_"].some(sub => item.key.includes(sub))) || fullstrings.includes(item.key)) {
                strings[item.key] = item.value;
            }
        });
    });
    languages[language] = strings;
}

if (MODE === 'hertz_wiki') {
    for (let language in languages) {
        const files = fs.readdirSync(path.join(LANGUAGES_BASEDIR, language, EXTRA_BASEDIR));
        let strings = {};

        files.forEach(file => {
            const data = JSON.parse(fs.readFileSync(path.join(LANGUAGES_BASEDIR, language, EXTRA_BASEDIR, file), 'utf-8'));
            data.forEach(item => {
                if (fullstrings.includes(item.key)) {
                    strings[item.key] = item.value;
                }
            });
        });
        languages[language] = { ...languages[language], ...strings };
    }
}

const koreanFiles = fs.readdirSync('hackin/languages/KOKR/');
let koreanStrings = {};
console.log('            - Parsing Korean language');

koreanFiles.forEach(file => {
    if (!file.endsWith('.csv')) return;

    const data = fs.readFileSync(`hackin/languages/KOKR/${file}`, 'utf-8').split('\n');
    data.forEach(line => {
        const [value, key] = line.rsplit(',', 1);
        koreanStrings[key] = value;
    });
});

languages["KOKR"] = koreanStrings;

for (let string in languages["USEN"]) {
    if (!languages["KOKR"][string]) {
        if (!["VOICE", "ILLUST"].some(sub => string.includes(sub))) {
            if (!string.includes("EID") || !languages["USEN"].hasOwnProperty(string.replace("EID", "PID"))) {
                console.log(`                - Missing Korean translation for "${string}", falling back to English as "${languages["USEN"][string]}"`);
            }
        }
        languages["KOKR"][string] = languages["USEN"][string];
    }
}

fs.writeFileSync('fulllanguages.json', JSON.stringify(languages));

const languagesunit = {};
const languagesard = {};
const languagessummon = {};

for (let language in languages) {
    languagesunit[language] = {};
    languagesard[language] = {};
    languagessummon[language] = {};

    for (let [key, value] of Object.entries(languages[language])) {
        if (!aetherstrings.includes(key)) {
            languagesunit[language][key] = value;
        }
        if (!["ILLUST", "VOICE", "SID", "EID"].some(sub => key.includes(sub)) && !unitstrings.includes(key) && !blessingstrings.includes(key) || basicstrings.includes(key) || aetherstrings.includes(key)) {
            languagesard[language][key] = value;
        }
        if (!fullstrings.concat(["ILLUST", "VOICE", "SID", "EID"]).some(sub => key.includes(sub))) {
            languagessummon[language][key] = value;
        }
    }

    fs.writeFileSync(`unitlanguages-${language}.json`, JSON.stringify(languagesunit[language]));
    fs.writeFileSync(`ardlanguages-${language}.json`, JSON.stringify(languagesard[language]));
    fs.writeFileSync(`summonlanguages-${language}.json`, JSON.stringify(languagessummon[language]));
}
