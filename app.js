let sourceDataMap = new Map();

function log(msg) {
    const logDiv = document.getElementById('debugLog');
    logDiv.innerHTML += `> ${msg}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

function clean(val) {
    if (val === undefined || val === null) return "";
    return String(val).trim().toLowerCase().replace(/\s+/g, ' ');
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
    log("Bestand 2 wordt geanalyseerd...");
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        log(`Tabblad [${name}] wordt gescand...`);
        
        rows.forEach((row, i) => {
            if (i === 0 || !row || row.length < 5) return; 

            // BRON (Bestand 2) LOCATIES:
            // B (index 1) = ID
            // C (index 2) = Titel
            // D (index 3) = Kleur
            // G (index 6) = SalePrijs (HIEER ZIT DE 38 EURO)
            // H (index 7) = Percentage (HIER ZIT DE 50%)
            
            const id = clean(row[1]); 
            const titel = clean(row[2]);
            const kleur = clean(row[3]);
            const combiKey = `${titel} ${kleur}`.trim();
            
            const salePrijs = row[6]; 
            const percentage = row[7]; 

            if (id && combiKey) {
                const finalKey = `${id}|${combiKey}`;
                sourceDataMap.set(finalKey, { salePrijs, percentage });
                
                // Extra check voor de 38 euro rij in het logboek
                if (salePrijs == 38) {
                    log(`MATCH GEVONDEN: ${finalKey} -> €${salePrijs}`);
                }
            }
        });
    }
    log(`Klaar! ${sourceDataMap.size} unieke matches opgeslagen.`);
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
            // We maken een kopie en zorgen dat de rij minstens 9 kolommen lang is
            let newRow = [...row];
            while (newRow.length < 9) newRow.push("");

            if (i === 0) {
                newRow[7] = "SalePrijs"; // Kolom H
                newRow[8] = "Percentage"; // Kolom I
                return newRow;
            }
            
            // DOEL (Bestand 1) LOCATIES:
            // D (index 3) = ID
            // E (index 4) = Samengestelde Titel Kleur
            const idB1 = clean(row[3]); 
            const infoB1 = clean(row[4]); 
            
            const searchKey = `${idB1}|${infoB1}`;
            const match = sourceDataMap.get(searchKey);

            if (match) {
                newRow[7] = match.salePrijs; // Naar Kolom H
                newRow[8] = match.percentage; // Naar Kolom I
            }
            return newRow;
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    log("Merge voltooid. Bestand wordt gedownload.");
    XLSX.writeFile(newWorkbook, "Resultaat_Sale_Update.xlsx");
}