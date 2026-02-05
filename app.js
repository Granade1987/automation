let sourceDataMap = new Map();

function log(msg) {
    const logDiv = document.getElementById('debugLog');
    logDiv.innerHTML += `> ${msg}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

// Functie om data echt goed schoon te maken voor mapping
function clean(val) {
    if (val === undefined || val === null) return "";
    return String(val).toLowerCase().replace(/\s+/g, ' ').trim();
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
    document.getElementById('debugLog').innerHTML = ""; 
    log("Bestand 2 (Bron) wordt geanalyseerd...");
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        log(`Tabblad [${name}]: ${rows.length} rijen gevonden.`);
        
        rows.forEach((row, i) => {
            if (i === 0 || !row || row.length < 2) return; 

            // Mapping 1: ID uit kolom B (index 1)
            const idB2 = clean(row[1]); 
            
            // Mapping 2: Titel (C) + Kleur (D) voor de I-kolom
            const titelC = clean(row[2]);
            const kleurD = clean(row[3]);
            const sleutelI = clean(`${titelC} ${kleurD}`);
            
            // Data om over te zetten: SalePrijs (E=index 4) en Percentage (F=index 5)
            const salePrijs = row[4] !== undefined ? row[4] : ""; 
            const percentage = row[5] !== undefined ? row[5] : ""; 

            if (idB2 && sleutelI) {
                // We maken een unieke combi-sleutel
                const finalKey = `${idB2}|${sleutelI}`;
                sourceDataMap.set(finalKey, { salePrijs, percentage });
            }
        });
    }
    
    log(`Klaar! ${sourceDataMap.size} unieke prijs-combinaties opgeslagen.`);
    document.getElementById('step2').classList.remove('disabled');
}

// STAP 2: Bestand 1 mappen
async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    if (!fileInput.files[0]) return;

    const allSheets = await readAllSheets(fileInput.files[0]);
    const newWorkbook = XLSX.utils.book_new();
    
    log("Bestand 1 (Doel) wordt verwerkt...");
    let matches = 0;
    let fails = 0;

    for (const name in allSheets) {
        const rows = allSheets[name];
        const updated = rows.map((row, i) => {
            // Header aanpassen
            if (i === 0) return [...row, "SalePrijs", "Percentage"];
            if (!row || row.length === 0) return row;

            // Zoekwaarden in Bestand 1
            const idB1 = clean(row[3]);    // Kolom D (index 3)
            const combiB1 = clean(row[4]); // Kolom E (index 4)
            
            const searchKey = `${idB1}|${combiB1}`;
            const match = sourceDataMap.get(searchKey);

            if (match) {
                matches++;
                return [...row, match.salePrijs, match.percentage];
            } else {
                fails++;
                if (fails < 5) log(`Geen match voor: ${searchKey}`);
                return [...row, "", ""];
            }
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    log(`Merge voltooid! Matches gevonden: ${matches}. Niet gevonden: ${fails}.`);
    XLSX.writeFile(newWorkbook, "Resultaat_Met_Prijzen.xlsx");
}