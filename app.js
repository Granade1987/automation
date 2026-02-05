let sourceDataMap = new Map();

function log(msg) {
    console.log(msg);
    const logDiv = document.getElementById('debugLog');
    if(logDiv) {
        logDiv.innerHTML += `> ${msg}<br>`;
        logDiv.scrollTop = logDiv.scrollHeight;
    }
}

// Zeer agressieve schoonmaak: alleen letters en cijfers overhouden
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

async function prepareSource() {
    const fileInput = document.getElementById('upload2');
    if (!fileInput.files[0]) return;
    
    // Bronbestand analyseren
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        rows.forEach((row, i) => {
            if (i < 1 || !row || row.length < 5) return; 

            // BRON (Bestand 2): 
            // Artikelnaam = index 1, Kleur = index 3
            // Sale prijs = index 5, Percentage = index 6
            const artVal = row[1] || '';
            const cVal = row[2] || '';
            const dVal = row[3] || '';
            const kolomI = cVal.trim() + ' ' + dVal.trim();
            const key = artVal.trim().toLowerCase() + kolomI.toLowerCase();
            
            const fVal = row[5]; 
            const gVal = row[6]; 

            if (key) {
                sourceDataMap.set(key, { f: fVal, g: gVal });
                
                if (row[5] == 38) {
                    log(`GEVONDEN IN BRON: "${row[1]} ${row[3]}" -> €${row[5]}`);
                }
            }
        });
    }
    log(`Klaar! ${sourceDataMap.size} unieke producten opgeslagen.`);
    document.getElementById('step2').classList.remove('disabled');
}

async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    if (!fileInput.files[0]) {
        alert('Selecteer bestand 1!');
        return;
    }
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    const newWorkbook = XLSX.utils.book_new();
    
    let matches = 0;

    for (const name in allSheets) {
        const rows = allSheets[name];
        const updated = rows.map((row, i) => {
            if (i === 0) {
                let h = [...row];
                h[7] = "Kolom F"; h[8] = "Kolom G";
                return h;
            }
            
            // DOEL (Bestand 1):
            // Mapping 1: kolom D (index 3) tegen bestand 2 kolom B
            // Mapping 2: kolom E (index 4) tegen bestand 2 kolom I
            const dVal = row[3] || '';
            const eVal = row[4] || '';
            const key = dVal.trim().toLowerCase() + eVal.trim().toLowerCase();
            
            const match = sourceDataMap.get(key);

            let newRow = [...row];
            while (newRow.length < 9) newRow.push("");

            if (match) {
                matches++;
                newRow[7] = match.f;
                newRow[8] = match.g;
            }
            return newRow;
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    alert(`Klaar! ${matches} matches gevonden.`);
    XLSX.writeFile(newWorkbook, "Resultaat_Mapping.xlsx");
}
}