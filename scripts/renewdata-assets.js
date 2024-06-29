import fs from 'fs';
import path from 'path';
import axios from 'axios';
import sharp from 'sharp';
import { obtaintrueurl, retrieveapidata } from './utils.js';

// Obtain all heroes
const units = JSON.parse(fs.readFileSync("../data/content/fullunits.json", 'utf-8'));

// Obtain all translations into English to get the defined names
const engrishname = JSON.parse(fs.readFileSync("../data/languages/fulllanguages.json", 'utf-8')).USEN;

// Obtain all skills to download icons
const skills = JSON.parse(fs.readFileSync("../data/content/fullskills.json", 'utf-8'));

console.log("\n       - Downloading skills icons...");
const params = {
    action: 'cargoquery',
    limit: 'max',
    offset: -500,
    format: 'json',
    tables: 'Skills',
    fields: "TagID,Icon",
    where: "Scategory in ('passivea', 'passiveb', 'passivec', 'sacredseal') OR RefinePath = 'skill1'"
};

// Store a relation of TagID to Icon for each skill
const passiveicons = {};
const data = await retrieveapidata(params);
data.forEach(entry => {
    passiveicons[entry.title.TagID] = entry.title.Icon;
});

// Split them in different lists to later be able to query by index
let ids = [];
let icons = [];
let arts = [];

for (const weapon of Object.keys(skills.weapons)) {
    if (skills.weapons[weapon].refines && skills.weapons[weapon].refines.Effect) {
        if (!fs.existsSync(`../data/img/icons/${weapon}-Effect.webp`)) {
            ids.push(weapon);
            icons.push(`${engrishname["M" + weapon]}_W.png`);
        }
    }
}

const passiveCategories = ["A", "B", "C", "S", "X"];
for (const category of passiveCategories) {
    for (const passive of Object.keys(skills.passives[category])) {
        if (!fs.existsSync(`../data/img/icons/${passive}.webp`)) {
            ids.push(passive);
            icons.push(`${engrishname["M" + passive]}.png`);
        }
    }
}

// We can only query 50 items every time
let offset = 0;
while (offset < icons.length) {
    const expandedIcons = icons.slice(offset, offset + 50);
    const urls = await obtaintrueurl(expandedIcons);
    urls.forEach((url, i) => {
        if (!url) {
            const matches = Object.entries(passiveicons).filter(([key]) => ids[offset + i].includes(key)).map(([key, val]) => val);
            if (matches.length > 0) {
                console.log(`              - ${engrishname["M" + ids[offset + i]]} falling back to wiki cargo table for icon name`);
                url = obtaintrueurl([matches[0]])[0];
            }
        }

        const filename = `${ids[offset + i]}${icons[offset + i].includes('_W.png') ? '-Effect.webp' : '.webp'}`;
        console.log(`              - ${engrishname["M" + ids[offset + i]]} doesn't have ${filename}, trying to download from: ${url}`);
        axios.get(url, { responseType: 'arraybuffer' })
            .then(response => sharp(response.data)
                .resize(response.data.width > 70 ? 48 : 44, response.data.width > 70 ? 48 : 44)
                .webp({ lossless: true, quality: 100 })
                .toFile(`../data/img/icons/${filename}`)
                .then(() => console.log(`Successfully downloaded ${filename}`))
                .catch(err => {
                    console.log(`Failed to download ${filename}`);
                    console.log(`Tried url: ${url}`);
                })
            )
            .catch(err => {
                console.log(`Failed to download ${filename}`);
                console.log(`Tried url: ${url}`);
            });
    });
    offset += 50;
}

console.log("\n       - Downloading character art...");

// Split them in different lists to later be able to query by index
ids = [];
arts = [];

for (const unit of Object.keys(units)) {
    const truename = engrishname["M" + unit] + (unit.includes("PID_") ? (": " + engrishname[unit.replace("PID", "MPID_HONOR")]) : "");
    let basenames = {};

    if (unit.includes("EID_") && !units[unit].boss) {
        basenames = {
            "_Portrait.webp": `${truename}_BtlFace.png`
        };
    } else {
        basenames = {
            "_Portrait.webp": `${truename}_Face.webp`,
            "_Attack.webp": `${truename}_BtlFace.webp`,
            "_Special.webp": `${truename}_BtlFace_C.webp`,
            "_Damage.webp": `${truename}_BtlFace_D.webp`
        };

        if (engrishname[unit.replace("PID", "MPID_VOICE") + "EX01"]) {
            basenames = {
                ...basenames,
                "_Resplendent_Portrait.webp": `${truename}_Resplendent_Face.webp`,
                "_Resplendent_Attack.webp": `${truename}_Resplendent_BtlFace.webp`,
                "_Resplendent_Special.webp": `${truename}_Resplendent_BtlFace_C.webp`,
                "_Resplendent_Damage.webp": `${truename}_Resplendent_BtlFace_D.webp`
            };
        }
    }

    for (const [basename, basenamePath] of Object.entries(basenames)) {
        if (!fs.existsSync(`../data/img/heroes/${unit}${basename}`)) {
            ids.push(unit);
            arts.push([basename, basenamePath]);
        }
    }
}

// We can only query 50 items every time
offset = 0;
while (offset < arts.length) {
    const expandedArts = arts.slice(offset, offset + 50).map(art => art[1]);
    const urls = await obtaintrueurl(expandedArts);
    urls.forEach((url, i) => {
        const filename = `${ids[offset + i]}${arts[offset + i][0]}`;
        console.log(`              - ${engrishname["M" + ids[offset + i]]} doesn't have ${filename}, trying to download from: ${url}`);
        axios.get(url, { responseType: 'arraybuffer' })
            .then(response => sharp(response.data)
                .resize(1330, 1596)
                .webp({ lossless: true, quality: 100 })
                .toFile(`../data/img/heroes/${filename}`)
                .then(() => console.log(`Successfully downloaded ${filename}`))
                .catch(err => {
                    console.log(`Failed to download ${filename}`);
                    console.log(`Tried url: ${url}`);
                })
            )
            .catch(err => {
                console.log(`Failed to download ${filename}`);
                console.log(`Tried url: ${url}`);
            });
    });
    offset += 50;
}

console.log("\n       - Downloading character sprites...");

ids = [];
arts = [];

for (const unit of Object.keys(units)) {
    if (unit.includes("EID_") && !units[unit].boss) {
        continue;
    }

    const truename = engrishname["M" + unit] + (unit.includes("PID_") ? (": " + engrishname[unit.replace("PID", "MPID_HONOR")]) : "");
    let sprites = {
        ".webp": `${truename}_Mini_Unit_Ok.png`
    };

    if (engrishname[unit.replace("PID", "MPID_VOICE") + "EX01"]) {
        sprites = {
            ...sprites,
            "_Resplendent.webp": `${truename}_Resplendent_Mini_Unit_Idle.png`
        };
    }

    for (const [sprite, spritePath] of Object.entries(sprites)) {
        if (!fs.existsSync(`../data/img/sprites/${unit}${sprite}`)) {
            ids.push(unit);
            arts.push([sprite, spritePath]);
        }
    }
}

// We can only query 50 items every time
offset = 0;
while (offset < arts.length) {
    const expandedArts = arts.slice(offset, offset + 50).map(art => art[1]);
    const urls = await obtaintrueurl(expandedArts);
    urls.forEach((url, i) => {
        const filename = `${ids[offset + i]}${arts[offset + i][0]}`;
        console.log(`              - ${engrishname["M" + ids[offset + i]]} doesn't have ${filename}, trying to download from: ${url}`);
        axios.get(url, { responseType: 'arraybuffer' })
            .then(response => sharp(response.data)
                .webp({ lossless: true, quality: 100 })
                .toFile(`../data/img/sprites/${filename}`)
                .then(() => console.log(`Successfully downloaded ${filename}`))
                .catch(err => {
                    console.log(`Failed to download ${filename}`);
                    console.log(`Tried url: ${url}`);
                })
            )
            .catch(err => {
                console.log(`Failed to download ${filename}`);
                console.log(`Tried url: ${url}`);
            });
    });
    offset += 50;
}

console.log("\n       - Downloading idle character sprites...");

ids = [];
arts = [];

for (const unit of Object.keys(units)) {
    if (unit.includes("EID_") && !units[unit].boss) {
        continue;
    }

    const truename = engrishname["M" + unit] + (unit.includes("PID_") ? (": " + engrishname[unit.replace("PID", "MPID_HONOR")]) : "");
    let sprites = {
        ".webp": `${truename}_Mini_Unit_Idle.png`
    };

    if (engrishname[unit.replace("PID", "MPID_VOICE") + "EX01"]) {
        sprites = {
            ...sprites,
            "_Resplendent.webp": `${truename}_Resplendent_Mini_Unit_Idle.png`
        };
    }

    for (const [sprite, spritePath] of Object.entries(sprites)) {
        if (!fs.existsSync(`../data/img/sprites-idle/${unit}${sprite}`)) {
            ids.push(unit);
            arts.push([sprite, spritePath]);
        }
    }
}

// We can only query 50 items every time
offset = 0;
while (offset < arts.length) {
    const expandedArts = arts.slice(offset, offset + 50).map(art => art[1]);
    const urls = await obtaintrueurl(expandedArts);
    urls.forEach((url, i) => {
        const filename = `${ids[offset + i]}${arts[offset + i][0]}`;
        console.log(`              - ${engrishname["M" + ids[offset + i]]} doesn't have ${filename}, trying to download from: ${url}`);
        axios.get(url, { responseType: 'arraybuffer' })
            .then(response => sharp(response.data)
                .webp({ lossless: true, quality: 100 })
                .toFile(`../data/img/sprites-idle/${filename}`)
                .then(() => console.log(`Successfully downloaded ${filename}`))
                .catch(err => {
                    console.log(`Failed to download ${filename}`);
                    console.log(`Tried url: ${url}`);
                })
            )
            .catch(err => {
                console.log(`Failed to download ${filename}`);
                console.log(`Tried url: ${url}`);
            });
    });
    offset += 50;
}

console.log("\n       - Downloading character faces for summon simulator...");

ids = [];
arts = [];

for (const unit of Object.keys(units)) {
    if (unit.includes("EID_") && !units[unit].boss) {
        continue;
    }

    const truename = engrishname["M" + unit] + (unit.includes("PID_") ? (": " + engrishname[unit.replace("PID", "MPID_HONOR")]) : "");
    let faces = {
        ".webp": `${truename}_Face_FC.webp`
    };

    if (engrishname[unit.replace("PID", "MPID_VOICE") + "EX01"]) {
        faces = {
            ...faces,
            "_Resplendent.webp": `${truename}_Resplendent_Face_FC.webp`
        };
    }

    for (const [face, facePath] of Object.entries(faces)) {
        if (!fs.existsSync(`../data/img/faces/${unit}${face}`)) {
            ids.push(unit);
            arts.push([face, facePath]);
        }
    }
}

// We can only query 50 items every time
offset = 0;
while (offset < arts.length) {
    const expandedArts = arts.slice(offset, offset + 50).map(art => art[1]);
    const urls = await obtaintrueurl(expandedArts);
    urls.forEach((url, i) => {
        const filename = `${ids[offset + i]}${arts[offset + i][0]}`;
        console.log(`              - ${engrishname["M" + ids[offset + i]]} doesn't have ${filename}, trying to download from: ${url}`);
        axios.get(url, { responseType: 'arraybuffer' })
            .then(response => sharp(response.data)
                .resize(50, 50)
                .webp({ lossless: true, quality: 100 })
                .toFile(`../data/img/faces/${filename}`)
                .then(() => console.log(`Successfully downloaded ${filename}`))
                .catch(err => {
                    console.log(`Failed to download ${filename}`);
                    console.log(`Tried url: ${url}`);
                })
            )
            .catch(err => {
                console.log(`Failed to download ${filename}`);
                console.log(`Tried url: ${url}`);
            });
    });
    offset += 50;
}

console.log("\n       - Downloading character faces for tier list generator...");

ids = [];
arts = [];

for (const unit of Object.keys(units)) {
    if (unit.includes("EID_") && !units[unit].boss) {
        continue;
    }

    const truename = engrishname["M" + unit] + (unit.includes("PID_") ? (": " + engrishname[unit.replace("PID", "MPID_HONOR")]) : "");
    let faces = {
        ".webp": `${truename}_Face_FC.webp`
    };

    if (engrishname[unit.replace("PID", "MPID_VOICE") + "EX01"]) {
        faces = {
            ...faces,
            "_Resplendent.webp": `${truename}_Resplendent_Face_FC.webp`
        };
    }

    for (const [face, facePath] of Object.entries(faces)) {
        if (!fs.existsSync(`../data/img/hd-faces/${unit}${face}`)) {
            ids.push(unit);
            arts.push([face, facePath]);
        }
    }
}

// We can only query 50 items every time
offset = 0;
while (offset < arts.length) {
    const expandedArts = arts.slice(offset, offset + 50).map(art => art[1]);
    const urls = await obtaintrueurl(expandedArts);
    urls.forEach((url, i) => {
        const filename = `${ids[offset + i]}${arts[offset + i][0]}`;
        console.log(`              - ${engrishname["M" + ids[offset + i]]} doesn't have '${filename}', trying to pull as '${expandedArts[i]}'`);
        axios.get(url, { responseType: 'arraybuffer' })
            .then(response => sharp(response.data)
                .resize(100, 100)
                .webp({ lossless: true, quality: 100 })
                .toFile(`../data/img/hd-faces/${filename}`)
                .then(() => console.log(`Successfully downloaded ${filename}`))
                .catch(err => {
                    console.log(`Failed to download ${filename}`);
                    console.log(`Tried url: ${url}`);
                })
            )
            .catch(err => {
                console.log(`Failed to download ${filename}`);
                console.log(`Tried url: ${url}`);
            });
    });
    offset += 50;
}

console.log("\n       - Downloading character faces for condensed template...");

ids = [];
arts = [];

for (const unit of Object.keys(units)) {
    const truename = engrishname["M" + unit] + (unit.includes("PID_") ? (": " + engrishname[unit.replace("PID", "MPID_HONOR")]) : "");
    let faces = {};

    if (unit.includes("EID_") && !units[unit].boss) {
        faces = {
            "_Attack.webp": `${truename}_BtlFace_BU.webp`
        };
    } else {
        faces = {
            "_Attack.webp": `${truename}_BtlFace_BU.webp`,
            "_Damage.webp": `${truename}_BtlFace_BU_D.webp`
        };

        if (engrishname[unit.replace("PID", "MPID_VOICE") + "EX01"]) {
            faces = {
                ...faces,
                "_Resplendent_Attack.webp": `${truename}_Resplendent_BtlFace_BU.webp`,
                "_Resplendent_Damage.webp": `${truename}_Resplendent_BtlFace_BU_D.webp`
            };
        }
    }

    for (const [face, facePath] of Object.entries(faces)) {
        if (!fs.existsSync(`../data/img/condensed-faces/${unit}${face}`)) {
            ids.push(unit);
            arts.push([face, facePath]);
        }
    }
}

// We can only query 50 items every time
offset = 0;
while (offset < arts.length) {
    const expandedArts = arts.slice(offset, offset + 50).map(art => art[1]);
    const urls = await obtaintrueurl(expandedArts);
    urls.forEach((url, i) => {
        const filename = `${ids[offset + i]}${arts[offset + i][0]}`;
        console.log(`              - ${engrishname["M" + ids[offset + i]]} doesn't have '${filename}', trying to pull as '${expandedArts[i]}'`);
        axios.get(url, { responseType: 'arraybuffer' })
            .then(response => sharp(response.data)
                .resize(321, 202)
                .webp({ lossless: true, quality: 100 })
                .toFile(`../data/img/condensed-faces/${filename}`)
                .then(() => console.log(`Successfully downloaded ${filename}`))
                .catch(err => {
                    console.log(`Failed to download ${filename}`);
                    console.log(`Tried url: ${url}`);
                })
            )
            .catch(err => {
                console.log(`Failed to download ${filename}`);
                console.log(`Tried url: ${url}`);
            });
    });
    offset += 50;
}
