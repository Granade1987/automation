let sourceDataMap = new Map();

function log(msg) {
    const logDiv = document.getElementById('debugLog');
    logDiv.innerHTML += `> ${msg}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight;
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
    document.getElementById('debugLog').innerHTML = ""; // Clear log
    log("Bestand 2 inlezen...");
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        log(`Tabblad [${name}]: ${rows.length} rijen.`);
        
        rows.forEach((row, i) => {
            if (i === 0 || !row.length) return; 

            const colB = String(row[1] || "").trim(); // ID
            const colC = String(row[2] || "").trim(); // Titel
            const colD = String(row[3] || "").trim(); // Kleur
            const colI = `${colC} ${colD}`.trim();    // Samengestelde sleutel
            
            // HIER AANGEPAST: We pakken nu Kolom E (index 4) en F (index 5)
            const valE = row[4] || ""; 
            const valF = row[5] || ""; 

            if (colB && colI) {
                const key = `${colB}|${colI}`.toLowerCase();
                sourceDataMap.set(key, { valE, valF });
            }
        });
    }
    
    log(`Klaar! ${sourceDataMap.size} unieke combinaties opgeslagen uit de bron.`);
    document.getElementById('step2').classList.remove('disabled');
}

// STAP 2: Bestand 1 mappen
async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    if (!fileInput.files[0]) return;

    const allSheets = await readAllSheets(fileInput.files[0]);
    const newWorkbook = XLSX.utils.book_new();
    
    log("Bestand 1 verwerken...");
    let matches = 0;
    let fails = 0;

    for (const name in allSheets) {
        const rows = allSheets[name];
        const updated = rows.map((row, i) => {
            if (i === 0) return [...row, "Toegevoegd_E", "Toegevoegd_F"];
            if (!row.length) return row;

            const b1D = String(row[3] || "").trim(); // ID kolom in Bestand 1
            const b1E = String(row[4] || "").trim(); // Samengestelde kolom in Bestand 1
            const searchKey = `${b1D}|${b1E}`.toLowerCase();
            
            const match = sourceDataMap.get(searchKey);
            if (match) {
                matches++;
                return [...row, match.valE, match.valF];
            } else {
                fails++;
                // Log de eerste paar mislukkingen om te zien wat er mis gaat
                if (fails < 10) log(`Geen match voor sleutel: "${searchKey}"`);
                return [...row, "", ""];
            }
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    log(`Merge voltooid! Totaal Matches: ${matches}, Totaal Mislukt: ${fails}`);
    XLSX.writeFile(newWorkbook, "Resultaat_E_F_Mapping.xlsx");
}