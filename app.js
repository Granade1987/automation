let sourceDataMap = new Map();

function log(msg) {
    const logDiv = document.getElementById('debugLog');
    logDiv.innerHTML += `> ${msg}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

// We maken de cleaning iets minder agressief om unieke ID's te behouden
function strictClean(val) {
    if (val === undefined || val === null) return "";
    return String(val).trim().toLowerCase();
}

async function readAllSheets(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const allData = {};
            workbook.SheetNames.forEach(name => {
                allData[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
            });
            resolve(allData);
        };
        reader.readAsBinaryString(file);
    });
}

// STAP 1: Bestand 2 verwerken
async function prepareSource() {
    const fileInput = document.getElementById('upload2');
    if (!fileInput.files[0]) return;
    
    document.getElementById('debugCard').style.display = 'block';
    document.getElementById('debugLog').innerHTML = "ANALYSE START...<br>";
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        rows.forEach((row, i) => {
            if (i === 0 || !row || row.length < 2) return; 

            // Bron locaties: B=1, C=2, D=3, E=4, F=5
            const idB2 = strictClean(row[1]); 
            const titelC = strictClean(row[2]);
            const kleurD = strictClean(row[3]);
            const combiKey = `${idB2}|${titelC} ${kleurD}`;
            
            const salePrijs = row[4];   // SalePrijs
            const percentage = row[5];  // Percentage

            if (idB2) {
                // Als er al een prijs staat voor deze sleutel, loggen we dat
                if (sourceDataMap.has(combiKey)) {
                    log(`⚠️ Dubbele match gevonden voor ${combiKey}. Oude prijs: ${sourceDataMap.get(combiKey).salePrijs}, Nieuwe: ${salePrijs}`);
                }
                sourceDataMap.set(combiKey, { salePrijs, percentage });
            }
        });
    }
    log(`✅ Analyse klaar. ${sourceDataMap.size} unieke koppelingen opgeslagen.`);
    document.getElementById('step2').classList.remove('disabled');
}

// STAP 2: Bestand 1 mappen
async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    const allSheets = await readAllSheets(fileInput.files[0]);
    const newWorkbook = XLSX.utils.book_new();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        const updated = rows.map((row, i) => {
            if (i === 0) return [...row, "SalePrijs", "Percentage"];
            
            // Doel locaties: D=3, E=4
            const idB1 = strictClean(row[3]); 
            const infoB1 = strictClean(row[4]); 
            
            const searchKey = `${idB1}|${infoB1}`;
            const match = sourceDataMap.get(searchKey);

            if (match) {
                // DEBUG: Log de match voor de bewuste 38 euro (als voorbeeld)
                if (match.salePrijs == 38 || match.salePrijs == 75) {
                    log(`Match gevonden! Sleutel: ${searchKey} -> Prijs: ${match.salePrijs}`);
                }
                return [...row, match.salePrijs, match.percentage];
            } else {
                return [...row, "", ""];
            }
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    log("Bestand gereed voor download.");
    XLSX.writeFile(newWorkbook, "RESULTAAT_GECHECKT.xlsx");
}