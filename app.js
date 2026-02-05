let sourceDataMap = new Map();

function log(msg) {
    const logDiv = document.getElementById('debugLog');
    logDiv.innerHTML += `> ${msg}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

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

// STAP 1: Bestand 2 verwerken
async function prepareSource() {
    const fileInput = document.getElementById('upload2');
    if (!fileInput.files[0]) return;
    
    document.getElementById('debugCard').style.display = 'block';
    document.getElementById('debugLog').innerHTML = "START BRON ANALYSE...<br>";
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        rows.forEach((row, i) => {
            if (i === 0 || !row || row.length < 2) return; 

            // BRON (Bestand 2) INDEXERING:
            // B=1 (ID), C=2 (Titel), D=3 (Kleur)
            // G=6 (SalePrijs), H=7 (Percentage)
            const id = clean(row[1]); 
            const titel = clean(row[2]);
            const kleur = clean(row[3]);
            const keyI = `${titel} ${kleur}`.trim(); // De samengestelde sleutel I
            
            const salePrijs = row[6]; // Kolom G (Sale Prijs)
            const percentage = row[7]; // Kolom H (Percentage)

            if (id && keyI) {
                const combinedKey = `${id}|${keyI}`;
                sourceDataMap.set(combinedKey, { salePrijs, percentage });
                
                // Debug voor de 38 euro rij
                if (salePrijs == 38) {
                    log(`GEVONDEN: ${combinedKey} = €${salePrijs} (${percentage})`);
                }
            }
        });
    }
    log(`Klaar! ${sourceDataMap.size} rijen geladen uit alle tabbladen.`);
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
            // We voegen SalePrijs toe aan H (index 7) en Percentage aan I (index 8)
            // Als de rij korter is, vullen we hem aan met lege waarden
            let newRow = [...row];
            while (newRow.length < 9) newRow.push("");

            if (i === 0) {
                newRow[7] = "SalePrijs";
                newRow[8] = "Percentage";
                return newRow;
            }
            
            // DOEL (Bestand 1) INDEXERING:
            // D=3 (ID), E=4 (Titel Kleur combinatie)
            const idB1 = clean(row[3]); 
            const infoB1 = clean(row[4]); 
            
            const searchKey = `${idB1}|${infoB1}`;
            const match = sourceDataMap.get(searchKey);

            if (match) {
                newRow[7] = match.salePrijs;
                newRow[8] = match.percentage;
            } else {
                newRow[7] = "";
                newRow[8] = "";
            }
            return newRow;
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    log("Mapping voltooid. Bestand wordt gedownload.");
    XLSX.writeFile(newWorkbook, "Croyez_Update_Final.xlsx");
}