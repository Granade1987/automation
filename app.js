let sourceDataMap = new Map();

function log(msg) {
    const logDiv = document.getElementById('debugLog');
    if(logDiv) {
        logDiv.innerHTML += `> ${msg}<br>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}

// Opschonen van data voor een zuivere match
function clean(val) {
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

async function prepareSource() {
    const fileInput = document.getElementById('upload2');
    if (!fileInput.files[0]) return;
    
    document.getElementById('debugCard').style.display = 'block';
    document.getElementById('debugLog').innerHTML = ""; 
    log("Analyse van Sale Fase bestand...");
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        rows.forEach((row, i) => {
            // We skippen de header en lege rijen
            if (i < 1 || !row || row.length < 5) return; 

            // BRON INDEXERING (Bestand 2):
            // 0: Artikelnummer (CA1-PF25-03)
            // 1: Artikelnaam (Étiquette Cap)
            // 3: Kleur (Black)
            // 5: Sale prijs (De 38 of 25 euro)
            // 6: Percentage (0.5 of 50%)

            const id = clean(row[0]); 
            const naam = clean(row[1]);
            const kleur = clean(row[3]);
            const combiKey = `${naam} ${kleur}`.trim();
            
            const salePrijs = row[5] || ""; 
            const percentage = row[6] || ""; 

            if (id && combiKey) {
                // De unieke sleutel die we ook in Bestand 1 verwachten
                const finalKey = `${id}|${combiKey}`;
                sourceDataMap.set(finalKey, { salePrijs, percentage });
                
                // Specifieke log voor jouw voorbeeld van 38 euro
                if (salePrijs == 38) {
                    log(`BRON MATCH: ${finalKey} = €${salePrijs}`);
                }
            }
        });
    }
    log(`Klaar! ${sourceDataMap.size} prijzen opgeslagen.`);
    document.getElementById('step2').classList.remove('disabled');
}

async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    const allSheets = await readAllSheets(fileInput.files[0]);
    const newWorkbook = XLSX.utils.book_new();
    
    log("Verwerken van Doelbestand...");
    let matchCount = 0;

    for (const name in allSheets) {
        const rows = allSheets[name];
        const updated = rows.map((row, i) => {
            // Header rij
            if (i === 0) {
                let headerRow = [...row];
                headerRow[7] = "Sale prijs";
                headerRow[8] = "Percentage";
                return headerRow;
            }
            
            // DOEL INDEXERING (Bestand 1):
            // D (index 3) = Artikelnummer
            // E (index 4) = Samengestelde omschrijving
            const idB1 = clean(row[3]); 
            const infoB1 = clean(row[4]); 
            
            const searchKey = `${idB1}|${infoB1}`;
            const match = sourceDataMap.get(searchKey);

            let newRow = [...row];
            // Zorg dat de rij lang genoeg is voor kolom H en I
            while (newRow.length < 9) newRow.push("");

            if (match) {
                matchCount++;
                newRow[7] = match.salePrijs; // Kolom H
                newRow[8] = match.percentage; // Kolom I
            }
            return newRow;
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    log(`Merge voltooid! ${matchCount} rijen succesvol geüpdatet.`);
    XLSX.writeFile(newWorkbook, "Croyez_Mapped_Result.xlsx");
}