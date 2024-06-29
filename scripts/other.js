import path from 'path';
import fs from 'fs'; 

const MODE = process.env.RENEWDATA_MODE || false;
let HEROES_BASEDIR;

if (MODE === 'hertz_wiki') {
    HEROES_BASEDIR = 'feh-assets-json/files/assets/Common/SRPG/Person/';
} else if (MODE === 'hackin_device') {
    HEROES_BASEDIR = 'hackin/heroes/';
} else {
    console.log('Invalid RENEWDATA_MODE environment variable, must be hertz_wiki or hackin_device');
    process.exit(1);
}

const hardcoded = JSON.parse(fs.readFileSync('hardcoded.json', 'utf-8'));

let other = {
    "blessed": {},
    "duo": [],
    "resonant": [],
    "ascended": [],
    "rearmed": [],
    "attuned": [],
    "emblem": [],
    "duokeywords": hardcoded["duokeywords"],
    "images": hardcoded["images"],
    "seasonals": hardcoded["seasonals"],
    "maps": hardcoded["maps"],
    "structures": hardcoded["structures"]
};

const files = fs.readdirSync(HEROES_BASEDIR);
files.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(HEROES_BASEDIR, file), 'utf-8'));
    data.forEach(entry => {
        if (entry["legendary"]) {
            if (entry["legendary"]["element"] > 0) {
                other["blessed"][entry["id_tag"]] = {
                    "blessing": entry["legendary"]["element"],
                    "boosts": Object.values(entry["legendary"]["bonus_effect"]),
                    "variant": Object.entries(entry["legendary"]["bonus_effect"])
                        .filter(([stat, value]) => value > 0 && stat !== "hp")
                        .map(([stat]) => stat)
                        .join('-')
                };

                if (entry["legendary"]["pair_up"]) {
                    other["blessed"][entry["id_tag"]]["variant"] += other["blessed"][entry["id_tag"]]["variant"] ? "-pairup" : "pairup";
                }
                if (entry["legendary"]["ae_extra"]) {
                    other["blessed"][entry["id_tag"]]["variant"] += "-extrae";
                }
            } else if ([2, 3, 4, 5, 6, 7].includes(entry["legendary"]["kind"])) {
                const specialtype = [null, null, "duo", "resonant", "ascended", "rearmed", "attuned", "emblem"][entry["legendary"]["kind"]];
                if (specialtype) {
                    other[specialtype].push(entry["id_tag"]);
                }
            }
        }
    });
});

fs.writeFileSync('fullother.json', JSON.stringify(other));

let otheronline = {
    "blessed": other["blessed"],
    "duo": other["duo"],
    "ascended": other["ascended"],
    "rearmed": other["rearmed"],
    "attuned": other["attuned"],
    "emblem": other["emblem"],
    "resonant": other["resonant"],
    "duokeywords": hardcoded["duokeywords"],
    "images": hardcoded["images"]
};
fs.writeFileSync('onlineother.json', JSON.stringify(otheronline));

let othercustom = {
    "blessed": other["blessed"],
    "duokeywords": hardcoded["duokeywords"],
    "images": hardcoded["images"]
};
fs.writeFileSync('customother.json', JSON.stringify(othercustom));

let othersummon = {
    "duokeywords": hardcoded["duokeywords"]
};
fs.writeFileSync('summonother.json', JSON.stringify(othersummon));

let othermaps = {
    "blessed": Object.fromEntries(
        Object.entries(other["blessed"]).map(([hero, properties]) => [
            hero,
            Object.fromEntries(
                Object.entries(properties).filter(([property]) => ["blessing", "variant"].includes(property))
            )
        ])
    ),
    "maps": hardcoded["maps"],
    "structures": hardcoded["structures"],
    "duokeywords": hardcoded["duokeywords"]
};
fs.writeFileSync('mapsother.json', JSON.stringify(othermaps));

let othertier = {
    "blessed": Object.fromEntries(
        Object.entries(other["blessed"]).map(([hero, properties]) => [
            hero,
            Object.fromEntries(
                Object.entries(properties).filter(([property]) => ["blessing"].includes(property))
            )
        ])
    ),
    "duo": other["duo"],
    "resonant": other["resonant"],
    "ascended": other["ascended"],
    "rearmed": other["rearmed"],
    "attuned": other["attuned"],
    "emblem": other["emblem"],
    "seasonals": hardcoded["seasonals"]
};
fs.writeFileSync('tierother.json', JSON.stringify(othertier));
