import path from 'path';
import fs from 'fs'; 

const MODE = process.env.RENEWDATA_MODE || false;
let SKILLS_BASEDIR, SEALS_BASEDIR;

if (MODE === 'hertz_wiki') {
    SKILLS_BASEDIR = 'feh-assets-json/files/assets/Common/SRPG/Skill/';
    SEALS_BASEDIR = 'feh-assets-json/files/assets/Common/SRPG/SkillAccessory/';
} else if (MODE === 'hackin_device') {
    SKILLS_BASEDIR = 'hackin/skills/';
    SEALS_BASEDIR = 'hackin/sacredseals/';
} else {
    console.log('Invalid RENEWDATA_MODE environment variable, must be hertz_wiki or hackin_device');
    process.exit(1);
}

let skills = {
    "weapons": {},
    "passives": {
        "A": {},
        "B": {},
        "C": {},
        "X": {},
        "S": {}
    },
    "assists": {},
    "specials": {},
    "emblemskills": {}
};
let categories = [skills["weapons"], skills["assists"], skills["specials"], skills["passives"]["A"], skills["passives"]["B"], skills["passives"]["C"], skills["passives"]["X"], skills["passives"]["S"], null, null, skills["emblemskills"]];
let refines = {};
let allskills = {};

const skillFiles = fs.readdirSync(SKILLS_BASEDIR);
skillFiles.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(SKILLS_BASEDIR, file), 'utf-8'));
    data.forEach(entry => {
        if (entry.id_tag !== 'SID_無し') {
            allskills[entry.id_tag] = entry;
            if (!entry.refine_base && entry.category >= 0 && entry.category < 8) {
                const category = entry.category;
                categories[category][entry.id_tag] = {
                    "weapon": entry.wep_equip,
                    "move": entry.mov_equip
                };
                if (entry.exclusive) {
                    categories[category][entry.id_tag]["prf"] = true;
                }
                if (!entry.next_skill && !entry.passive_next && category !== 7) {
                    categories[category][entry.id_tag]["max"] = true;
                }
                if (category !== 1 && category !== 2) {
                    categories[category][entry.id_tag]["stats"] = Object.values(entry.stats);
                }
                if (category === 0) {
                    skills["weapons"][entry.id_tag]["stats"][1] += entry.might;
                    skills["weapons"][entry.id_tag]["refines"] = {};
                    if (entry.arcane_weapon) {
                        skills["weapons"][entry.id_tag]["arcane"] = true;
                    }
                } else if (category >= 3 && category < 8) {
                    categories[category][entry.id_tag]["iconid"] = entry.icon_id;
                }
            } else if (entry.refine_base) {
                refines[entry.id_tag] = {
                    "baseWeapon": entry.refine_base,
                    "stats": Object.values(entry.stats)
                };
                refines[entry.id_tag]["stats"][1] += entry.might;
                if (entry.refine_id && entry.refine_id !== "SID_神罰の杖3" && entry.refine_id !== "SID_幻惑の杖3") {
                    refines[entry.id_tag]["effectid"] = entry.refine_id;
                    refines[entry.id_tag]["iconid"] = entry.icon_id;
                }
            } else if (entry.category === 10) {
                const category = entry.category;
                categories[category][entry.id_tag] = {
                    "iconid": entry.icon_id
                };
            }
        }
    });
});

const refinenames = {"神": "Wrathful", "幻": "Dazzling", "ATK": "Atk", "AGI": "Spd", "DEF": "Def", "RES": "Res"};
const refineextendednames = {
    "神_ATK": "Wrathful+Atk", "神_AGI": "Wrathful+Spd", "神_DEF": "Wrathful+Def", "神_RES": "Wrathful+Res",
    "幻_ATK": "Dazzling+Atk", "幻_AGI": "Dazzling+Spd", "幻_DEF": "Dazzling+Def", "幻_RES": "Dazzling+Res"
};
for (let refinable in refines) {
    let refine = refinable.split("_").pop();
    refine = refinenames[refine] || "Effect";
    const refineextended = refinable.split("_").slice(-2).join("_");
    refine = refineextendednames[refineextended] || refine;
    skills["weapons"][refines[refinable]["baseWeapon"]]["refines"][refine] = {
        "stats": refines[refinable]["stats"]
    };
    if (refine === "Effect") {
        let basestats = skills["weapons"][refines[refinable]["baseWeapon"]]["refines"][refine]["stats"];
        if (refines[refinable]["effectid"]) {
            const effectstats = Object.values(allskills[refines[refinable]["effectid"]].stats);
            basestats = basestats.map((stat, index) => stat + effectstats[index]);
        }
        skills["weapons"][refines[refinable]["baseWeapon"]]["refines"][refine] = {
            "stats": basestats,
            "iconid": refines[refinable]["iconid"]
        };
    }
}

const sealFiles = fs.readdirSync(SEALS_BASEDIR);
sealFiles.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(SEALS_BASEDIR, file), 'utf-8'));
    const allpassives = {...skills["passives"]["A"], ...skills["passives"]["B"], ...skills["passives"]["C"], ...skills["passives"]["S"]};
    data.forEach(entry => {
        if (entry.id_tag !== 'SID_無し') {
            skills["passives"]["S"][entry.id_tag] = allpassives[entry.id_tag];
            skills["passives"]["S"][entry.id_tag]["max"] = !entry.next_seal;
        }
    });
});

fs.writeFileSync('fullskills.json', JSON.stringify(skills));

const skillsskeleton = {
    "weapons": Object.keys(skills["weapons"]).reduce((acc, weaponname) => ({...acc, [weaponname]: {}}), {}),
    "assists": Object.keys(skills["assists"]).reduce((acc, assist) => ({...acc, [assist]: {}}), {}),
    "specials": Object.keys(skills["specials"]).reduce((acc, special) => ({...acc, [special]: {}}), {}),
    "passives": {
        "A": Object.keys(skills["passives"]["A"]).reduce((acc, passive) => ({...acc, [passive]: {}}), {}),
        "B": Object.keys(skills["passives"]["B"]).reduce((acc, passive) => ({...acc, [passive]: {}}), {}),
        "C": Object.keys(skills["passives"]["C"]).reduce((acc, passive) => ({...acc, [passive]: {}}), {}),
        "S": Object.keys(skills["passives"]["S"]).reduce((acc, passive) => ({...acc, [passive]: {}}), {})
    }
};
fs.writeFileSync('skeletonskills.json', JSON.stringify(skillsskeleton));

const skillsonline = {
    "weapons": Object.fromEntries(
        Object.entries(skills["weapons"]).map(([weaponname, properties]) => [
            weaponname,
            {...properties}
        ])
    ),
    "passives": Object.fromEntries(
        ["A", "B", "C", "X", "S"].map(category => [
            category,
            Object.fromEntries(
                Object.entries(skills["passives"][category]).map(([passive, properties]) => [
                    passive,
                    Object.fromEntries(
                        Object.entries(properties).filter(([property]) => property !== "iconid")
                    )
                ])
            )
        ])
    ),
    "assists": skills["assists"],
    "specials": skills["specials"]
};

for (let weapon in skillsonline["weapons"]) {
    if (skillsonline["weapons"][weapon]["refines"] && skillsonline["weapons"][weapon]["refines"]["Effect"]) {
        delete skillsonline["weapons"][weapon]["refines"]["Effect"]["iconid"];
    }
}
fs.writeFileSync('onlineskills.json', JSON.stringify(skillsonline));

const skillscustom = {
    "weapons": Object.fromEntries(
        Object.entries(skills["weapons"]).map(([weaponname, properties]) => [
            weaponname,
            Object.fromEntries(
                Object.entries(properties).filter(([property]) => property !== "prf")
            )
        ])
    ),
    "assists": skills["assists"],
    "specials": skills["specials"],
    "passives": Object.fromEntries(
        ["A", "B", "C", "X", "S"].map(category => [
            category,
            Object.fromEntries(
                Object.entries(skills["passives"][category]).map(([passive, properties]) => [
                    passive,
                    Object.fromEntries(
                        Object.entries(properties).filter(([property]) => !["prf", "iconid"].includes(property))
                    )
                ])
            )
        ])
    )
};
fs.writeFileSync('customskills.json', JSON.stringify(skillscustom));
