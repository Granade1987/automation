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

async function prepareSource() {
    const fileInput = document.getElementById('upload2');
    if (!fileInput.files[0]) return;
    
    document.getElementById('debugCard').style.display = 'block';
    log("Bestand 2 inlezen...");
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        log(`Tabblad [${name}] gevonden met ${rows.length} rijen.`);
        
        rows.forEach((row, i) => {
            if (i === 0 || !row.length) return; // Skip header

            // Schoonmaken van data (stript spaties en forceert String)
            const colB = String(row[1] || "").trim();
            const colC = String(row[2] || "").trim();
            const colD = String(row[3] || "").trim();
            const colI = `${colC} ${colD}`.trim();
            const valG = row[6] || "";
            const valH = row[7] || "";

            if (colB && colI) {
                const key = `${colB}|${colI}`.toLowerCase(); // Case-insensitive mapping
                sourceDataMap.set(key, { valG, valH });
                if (i < 3) log(`Voorbeeld Sleutel gemaakt: ${key}`);
            }
        });
    }
    
    log(`Klaar! ${sourceDataMap.size} unieke combinaties opgeslagen.`);
    document.getElementById('step2').classList.remove('disabled');
}

async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    const allSheets = await readAllSheets(fileInput.files[0]);
    const newWorkbook = XLSX.utils.book_new();
    
    log("Bestand 1 verwerken...");
    let matches = 0;
    let fails = 0;

    for (const name in allSheets) {
        const rows = allSheets[name];
        const updated = rows.map((row, i) => {
            if (i === 0) return [...row, "RESULT_G", "RESULT_H"];
            
            const b1D = String(row[3] || "").trim();
            const b1E = String(row[4] || "").trim();
            const searchKey = `${b1D}|${b1E}`.toLowerCase();
            
            const match = sourceDataMap.get(searchKey);
            if (match) {
                matches++;
                return [...row, match.valG, match.valH];
            } else {
                fails++;
                if (fails < 5) log(`Geen match voor: ${searchKey}`);
                return [...row, "", ""];
            }
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    log(`Merge voltooid! Matches: ${matches}, Mislukt: ${fails}`);
    XLSX.writeFile(newWorkbook, "DEBUG_RESULTAAT.xlsx");
}