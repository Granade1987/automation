let sourceDataMap = new Map();

/**
 * Leest een Excel bestand en geeft een object terug met alle tabbladen als arrays
 */
async function readAllSheets(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const allData = {};
            workbook.SheetNames.forEach(name => {
                allData[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
            });
            resolve({ data: allData, workbook: workbook });
        };
        reader.readAsBinaryString(file);
    });
}

// STAP 1: Bestand 2 verwerken (Alle tabbladen)
async function prepareSource() {
    const fileInput = document.getElementById('upload2');
    if (!fileInput.files[0]) return alert("Selecteer eerst bestand 2!");

    const result = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    const previewBody = document.getElementById('previewBody');
    previewBody.innerHTML = '';

    let count = 0;

    // Loop door elk tabblad in Bestand 2
    for (const sheetName in result.data) {
        const rows = result.data[sheetName];
        
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 2) continue;

            const colB = String(row[1] || "").trim(); // Index 1
            const colC = String(row[2] || "").trim(); // Index 2
            const colD = String(row[3] || "").trim(); // Index 3
            const colI = `${colC} ${colD}`.trim();    // Samengestelde I
            
            const valG = row[6] || ""; // Index 6
            const valH = row[7] || ""; // Index 7

            const doubleKey = `${colB}|${colI}`;
            if (colB && colI) {
                sourceDataMap.set(doubleKey, { valG, valH });

                if (count < 10) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td>${colB}</td><td class="highlight">${colI}</td><td>${valG}</td><td>${valH}</td>`;
                    previewBody.appendChild(tr);
                    count++;
                }
            }
        }
    }

    document.getElementById('matchCount').innerText = `✅ ${sourceDataMap.size} unieke combinaties gevonden over alle tabbladen.`;
    document.getElementById('previewContainer').style.display = 'block';
    document.getElementById('step2').classList.remove('disabled');
}

// STAP 2: Bestand 1 mappen (Alle tabbladen)
async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    if (!fileInput.files[0]) return alert("Selecteer eerst bestand 1!");

    const result = await readAllSheets(fileInput.files[0]);
    const newWorkbook = XLSX.utils.book_new();

    // Loop door elk tabblad in Bestand 1
    for (const sheetName in result.data) {
        const rows = result.data[sheetName];
        
        const updatedRows = rows.map((row, index) => {
            if (index === 0) return [...row, "Matched_G", "Matched_H"];
            if (!row || row.length === 0) return row;

            const b1ColD = String(row[3] || "").trim(); // Index 3
            const b1ColE = String(row[4] || "").trim(); // Index 4

            const searchKey = `${b1ColD}|${b1ColE}`;
            const match = sourceDataMap.get(searchKey);

            return match ? [...row, match.valG, match.valH] : [...row, "", ""];
        });

        const newSheet = XLSX.utils.aoa_to_sheet(updatedRows);
        XLSX.utils.book_append_sheet(newWorkbook, newSheet, sheetName);
    }

    XLSX.writeFile(newWorkbook, "Bestand1_Compleet_Gemapped.xlsx");
}