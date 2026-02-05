let sourceDataMap = new Map();

function log(msg) {
    const logDiv = document.getElementById('debugLog');
    logDiv.innerHTML += `> ${msg}<br>`;
    logDiv.scrollTop = logDiv.scrollHeight;
}

// Extra krachtige cleaning om verschillen in formatting te negeren
function superClean(val) {
    if (val === undefined || val === null) return "";
    return String(val).toLowerCase().replace(/[^a-z0-9]/g, '').trim(); 
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
    document.getElementById('debugLog').innerHTML = "LOG START...<br>";
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        rows.forEach((row, i) => {
            if (i === 0 || !row || row.length < 2) return; 

            // Mapping criteria uit Bestand 2
            const idB2 = superClean(row[1]);  // Kolom B
            const titelC = superClean(row[2]); // Kolom C
            const kleurD = superClean(row[3]); // Kolom D
            const combineI = titelC + kleurD;  // Samengesteld
            
            // DE DATA DIE WE NODIG HEBBEN
            const salePrijs = row[4];   // Kolom E
            const percentage = row[5];  // Kolom F

            if (idB2 && combineI) {
                const key = `${idB2}|${combineI}`;
                sourceDataMap.set(key, { salePrijs, percentage });
                
                // Debug eerste rij met 38 euro
                if (salePrijs == 38) {
                    log(`BRON GEVONDEN: ID ${row[1]} met prijs ${salePrijs} opgeslagen.`);
                }
            }
        });
    }
    log(`Klaar! ${sourceDataMap.size} unieke rijen geladen uit Bron.`);
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
            if (i === 0) return [...row, "SalePrijs_Nieuw", "Percentage_Nieuw"];
            
            // Mapping criteria uit Bestand 1
            const idB1 = superClean(row[3]);    // Kolom D
            const combineB1 = superClean(row[4]); // Kolom E (Titel Kleur)
            
            const searchKey = `${idB1}|${combineB1}`;
            const match = sourceDataMap.get(searchKey);

            if (match) {
                return [...row, match.salePrijs, match.percentage];
            } else {
                return [...row, "", ""];
            }
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    log("Bestand gegenereerd. Download start...");
    XLSX.writeFile(newWorkbook, "FIX_RESULTAAT.xlsx");
}