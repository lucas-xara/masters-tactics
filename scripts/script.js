// Função para carregar um arquivo JSON
function loadJSON(url, callback) {
    fetch(url)
        .then(response => response.json())
        .then(data => callback(data)) 
        .catch(error => console.error('Erro ao carregar o JSON:', error));
}

// Mapeia os códigos de arma e movimento para suas representações textuais
const weaponTypes = {
    3: "Sword",
    4: "Lance",
    5: "Axe",
    6: "Bow",
    7: "Dagger",
    8: "Tome",
    9: "Staff",
    10: "Breath",
    11: "Beast"
};

const moveTypes = {
    0: "Infantry",
    1: "Armored",
    2: "Cavalry",
    3: "Flying"
};

// Função para construir a URL da imagem
function constructImageURL(firstName, title, type) {
    const baseUrl = "https://feheroes.fandom.com/wiki/Special:FilePath/";
    const formattedTitle = title.replace(/ /g, "_");
    const filename = `${firstName}_${formattedTitle}_${type}.webp`;
    return `${baseUrl}${filename}`;
}

// Função para inicializar a página
function init() {
    // Carregar ambos os arquivos JSON
    console.log("Initiating");
    loadJSON('../../content/units.json', function (unitsData) { // Caminho corrigido para o arquivo units.json
        loadJSON('../../content/en-us.json', function (namesData) { // Caminho corrigido para o arquivo en-us.json
            const heroSelect = document.getElementById('hero-select');
            const heroInfo = document.getElementById('hero-info');

            // Verifica se os JSONs foram carregados corretamente
            console.log("Units data loaded:", unitsData);
            console.log("Names data loaded:", namesData);

            // Popula o dropdown com os nomes amigáveis dos heróis
            for (const unitID in unitsData) {
                // Pula IDs que começam com "EID_"
                if (unitID.startsWith('EID_')) continue;

                const heroID = unitID.replace('PID_', 'MPID_');
                const firstName = namesData[heroID] || unitID;
                const title = namesData[`MPID_HONOR_${heroID.slice(5)}`] || '';
                const heroName = title ? `${firstName}: ${title}` : firstName;

                console.log(`Processando ID do herói: ${unitID}`);
                console.log(`Nome amigável: ${heroName}`);

                const option = document.createElement('option');
                option.value = unitID;
                option.textContent = heroName; // Use o nome amigável se disponível
                heroSelect.appendChild(option);
            }

            // Evento de mudança para exibir as informações do herói selecionado
            heroSelect.addEventListener('change', function () {
                const selectedHeroID = heroSelect.value;
                if (selectedHeroID) {
                    const hero = unitsData[selectedHeroID];
                    const heroID = selectedHeroID.replace('PID_', 'MPID_');
                    const firstName = namesData[heroID] || selectedHeroID;
                    const title = namesData[`MPID_HONOR_${heroID.slice(5)}`] || '';
                    const heroName = title ? `${firstName}: ${title}` : firstName;

                    const portraitUrl = constructImageURL(firstName, title, "Face");
                    const attackUrl = constructImageURL(firstName, title, "BtlFace");
                    const specialUrl = constructImageURL(firstName, title, "BtlFace_C");
                    const damageUrl = constructImageURL(firstName, title, "BtlFace_D");

                    console.log("URL da imagem do retrato:", portraitUrl);
                    console.log("URL da imagem do ataque:", attackUrl);
                    console.log("URL da imagem do especial:", specialUrl);
                    console.log("URL da imagem do dano:", damageUrl);

                    heroInfo.innerHTML = `
                        <h2>${heroName}</h2>
                        <p><strong>Weapon Type:</strong> ${weaponTypes[hero.weapon]}</p>
                        <p><strong>Move Type:</strong> ${moveTypes[hero.move]}</p>
                        <p><strong>Stats:</strong></p>
                        <ul>
                            <li>HP: ${hero.stats[0]}</li>
                            <li>Atk: ${hero.stats[1]}</li>
                            <li>Spd: ${hero.stats[2]}</li>
                            <li>Def: ${hero.stats[3]}</li>
                            <li>Res: ${hero.stats[4]}</li>
                        </ul>
                        <p><strong>Growths:</strong></p>
                        <ul>
                            <li>HP: ${hero.growths[0]}%</li>
                            <li>Atk: ${hero.growths[1]}%</li>
                            <li>Spd: ${hero.growths[2]}%</li>
                            <li>Def: ${hero.growths[3]}%</li>
                            <li>Res: ${hero.growths[4]}%</li>
                        </ul>
                        <div class="hero-art">
                            <h3>Art</h3>
                            <img src="${portraitUrl}" alt="${heroName} Portrait" onerror="this.onerror=null; this.src='images/default.png';">
                            <img src="${attackUrl}" alt="${heroName} Attack" onerror="this.onerror=null; this.src='images/default.png';">
                            <img src="${specialUrl}" alt="${heroName} Special" onerror="this.onerror=null; this.src='images/default.png';">
                            <img src="${damageUrl}" alt="${heroName} Damage" onerror="this.onerror=null; this.src='images/default.png';">
                        </div>
                    `;
                } else {
                    heroInfo.innerHTML = '';
                }
            });
        });
    });
}

// Inicializa a página quando o documento estiver pronto
document.addEventListener('DOMContentLoaded', init);
