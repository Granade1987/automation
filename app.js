let sourceDataMap = new Map();

async function readFile(file) {
    return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const workbook = XLSX.read(e.target.result, { type: 'binary' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            resolve(XLSX.utils.sheet_to_json(sheet, { header: 1 }));
        };
        reader.readAsBinaryString(file);
    });
}

// STAP 1: Bestand 2 verwerken
async function prepareSource() {
    const fileInput = document.getElementById('upload2');
    if (!fileInput.files[0]) return alert("Selecteer eerst bestand 2!");

    const rows = await readFile(fileInput.files[0]);
    sourceDataMap.clear();
    const previewBody = document.getElementById('previewBody');
    previewBody.innerHTML = '';

    let count = 0;
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length < 2) continue;

        const colB = String(row[1] || "").trim(); // Bestand 2 Kolom B
        const colC = String(row[2] || "").trim(); // Bestand 2 Kolom C
        const colD = String(row[3] || "").trim(); // Bestand 2 Kolom D
        const colI = `${colC} ${colD}`.trim();    // De samengestelde kolom I
        
        const valG = row[6] || ""; // Data uit G
        const valH = row[7] || ""; // Data uit H

        // We maken een unieke combinatiesleutel voor de dubbele check: "B|I"
        const doubleKey = `${colB}|${colI}`;
        sourceDataMap.set(doubleKey, { valG, valH });

        if (count < 10) {
            const tr = document.createElement('tr');
            tr.innerHTML = `<td>${colB}</td><td>${colC}</td><td>${colD}</td><td class="highlight">${colI}</td><td>${valG}</td><td>${valH}</td>`;
            previewBody.appendChild(tr);
            count++;
        }
    }

    document.getElementById('matchCount').innerText = `✅ ${sourceDataMap.size} rijen klaar voor mapping.`;
    document.getElementById('previewContainer').style.display = 'block';
    document.getElementById('step2').classList.remove('disabled');
}

// STAP 2: Bestand 1 mappen
async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    if (!fileInput.files[0]) return alert("Selecteer eerst bestand 1!");

    const rows = await readFile(fileInput.files[0]);
    
    const resultRows = rows.map((row, index) => {
        if (index === 0) return [...row, "Matched_G", "Matched_H"];

        const b1ColD = String(row[3] || "").trim(); // Bestand 1 Kolom D
        const b1ColE = String(row[4] || "").trim(); // Bestand 1 Kolom E

        // Maak dezelfde combinatiesleutel voor de check
        const searchKey = `${b1ColD}|${b1ColE}`;
        const match = sourceDataMap.get(searchKey);

        if (match) {
            return [...row, match.valG, match.valH];
        } else {
            return [...row, "", ""]; // Geen match = lege kolommen
        }
    });

    const ws = XLSX.utils.aoa_to_sheet(resultRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultaat");
    XLSX.writeFile(wb, "Bestand1_Updated.xlsx");
}