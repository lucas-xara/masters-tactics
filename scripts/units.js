import path from 'path';
import fs from 'fs'; 

const MODE = process.env.RENEWDATA_MODE || false;
let EVOLUTIONS_BASEDIR, HEROES_BASEDIR, ENEMIES_BASEDIR;

if (MODE === 'hertz_wiki') {
    EVOLUTIONS_BASEDIR = 'feh-assets-json/files/assets/Common/SRPG/WeaponRefine/';
    HEROES_BASEDIR = 'feh-assets-json/files/assets/Common/SRPG/Person/';
    ENEMIES_BASEDIR = 'feh-assets-json/files/assets/Common/SRPG/Enemy/';
} else if (MODE === 'hackin_device') {
    EVOLUTIONS_BASEDIR = 'hackin/weaponevolutions/';
    HEROES_BASEDIR = 'hackin/heroes/';
    ENEMIES_BASEDIR = 'hackin/enemy/';
} else {
    console.log('Invalid RENEWDATA_MODE environment variable, must be hertz_wiki or hackin_device');
    process.exit(1);
}

let heroes = {};

const weapons = JSON.parse(fs.readFileSync('fullskills.json', 'utf-8')).weapons;
let weaponevolutions = {};

const evolutionFiles = fs.readdirSync(EVOLUTIONS_BASEDIR);
evolutionFiles.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(EVOLUTIONS_BASEDIR, file), 'utf-8'));
    data.forEach(entry => {
        if (weapons.includes(entry.refined)) {
            weaponevolutions[entry.orig] = entry.refined;
        }
    });
});

const strings = JSON.parse(fs.readFileSync('fulllanguages.json', 'utf-8')).USEN;
let facenames = [];

const heroFiles = fs.readdirSync(HEROES_BASEDIR);
heroFiles.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(HEROES_BASEDIR, file), 'utf-8'));
    data.forEach(entry => {
        if (entry.id_tag !== 'PID_無し') {
            heroes[entry.id_tag] = {
                stats: Object.values(entry.base_stats).map(value => value - 2),
                growths: Object.values(entry.growth_rates),
                weapon: entry.weapon_type,
                origin: entry.series,
                move: entry.move_type,
                flowers: entry.dragonflowers.max_count,
                basekit: [].concat(...entry.skills).filter(skill => skill),
                resplendent: strings.hasOwnProperty(entry.id_tag.replace('PID', 'MPID_VOICE') + 'EX01'),
                id: entry.id_num,
                art: entry.face_name
            };
            facenames.push(entry.face_name);

            let tempkit = [];
            heroes[entry.id_tag].basekit.forEach(skill => {
                if (!tempkit.includes(skill)) {
                    tempkit.push(skill);
                }
            });
            heroes[entry.id_tag].basekit = tempkit;

            heroes[entry.id_tag].basekit.forEach(item => {
                if (weaponevolutions.hasOwnProperty(item)) {
                    heroes[entry.id_tag].basekit.push(weaponevolutions[item]);
                }
            });
        }
    });
});

const enemyFiles = fs.readdirSync(ENEMIES_BASEDIR);
enemyFiles.forEach(file => {
    const data = JSON.parse(fs.readFileSync(path.join(ENEMIES_BASEDIR, file), 'utf-8'));
    data.forEach(entry => {
        if (entry.id_tag !== 'EID_無し' && (!entry.is_boss || !facenames.includes(entry.face_name)) && entry.face_name) {
            heroes[entry.id_tag] = {
                stats: Object.values(entry.base_stats).map(value => value - 2),
                growths: Object.values(entry.growth_rates),
                weapon: entry.weapon_type,
                move: entry.move_type,
                basekit: entry.is_boss ? [entry.top_weapon] : [],
                art: entry.face_name,
                boss: entry.is_boss
            };
        }
    });
});

const heroessorted = Object.entries(heroes).sort((a, b) => (a[1].id || -1) - (b[1].id || -1));
heroes = Object.fromEntries(heroessorted);

fs.writeFileSync('fullunits.json', JSON.stringify(heroes));

const heroesskeleton = Object.fromEntries(Object.keys(heroes).map(heroname => [heroname, {}]));
fs.writeFileSync('skeletonunits.json', JSON.stringify(heroesskeleton));

const heroesonline = Object.fromEntries(Object.entries(heroes).map(([heroname, properties]) => [
    heroname,
    Object.fromEntries(Object.entries(properties).filter(([property]) => ["weapon", "move", "stats", "growths", "basekit", "flowers"].includes(property)))
]));
fs.writeFileSync('onlineunits.json', JSON.stringify(heroesonline));

const heroescustom = Object.fromEntries(Object.entries(heroes).map(([heroname, properties]) => [
    heroname,
    Object.fromEntries(Object.entries(properties).filter(([property]) => ["weapon", "move", "stats", "growths"].includes(property)))
]));
fs.writeFileSync('customunits.json', JSON.stringify(heroescustom));

const heroessummon = Object.fromEntries(Object.entries(heroes).filter(([heroname]) => !heroname.includes('EID')).map(([heroname, properties]) => [
    heroname,
    Object.fromEntries(Object.entries(properties).filter(([property]) => ["weapon"].includes(property)))
]));
fs.writeFileSync('summonunits.json', JSON.stringify(heroessummon));

const heroestier = Object.fromEntries(Object.entries(heroes).filter(([heroname]) => !heroname.includes('EID')).map(([heroname, properties]) => [
    heroname,
    Object.fromEntries(Object.entries(properties).filter(([property]) => ["weapon", "move", "origin", "resplendent", "id"].includes(property)))
]));
fs.writeFileSync('tierunits.json', JSON.stringify(heroestier));
