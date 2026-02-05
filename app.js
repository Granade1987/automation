let sourceMap = new Map();

// Helper om bestand te lezen
async function readFile(file) {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data);
    const firstSheetName = workbook.SheetNames[0];
    return XLSX.utils.sheet_to_json(workbook.Sheets[firstSheetName], { header: 1 });
}

// STAP 1: Bestand 2 inlezen en indexeren
async function prepareSource() {
    const fileInput = document.getElementById('upload2');
    if (!fileInput.files[0]) return alert("Selecteer eerst bestand 2!");

    const rows = await readFile(fileInput.files[0]);
    sourceMap.clear();

    // Loop door rijen (skip header met i=1)
    for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        const colC = String(row[2] || "").trim(); // Index 2
        const colD = String(row[3] || "").trim(); // Index 3
        
        // Maak de sleutel voor Kolom I (Titel + Kleur)
        const keyI = `${colC} ${colD}`.trim();
        
        // Sla de data uit G (index 6) en H (index 7) op
        if (keyI !== "") {
            sourceMap.set(keyI, {
                valG: row[6] || "",
                valH: row[7] || ""
            });
        }
    }

    document.getElementById('status1').innerHTML = `✅ ${sourceMap.size} unieke rijen voorbereid!`;
    document.getElementById('step2').classList.remove('disabled');
}

// STAP 2: Bestand 1 mappen en exporteren
async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    if (!fileInput.files[0]) return alert("Selecteer eerst bestand 1!");

    const rows = await readFile(fileInput.files[0]);
    
    // Bewerk de data
    const updatedRows = rows.map((row, index) => {
        if (index === 0) {
            // Headers toevoegen aan het resultaat
            return [...row, "Toegevoegd_G", "Toegevoegd_H"];
        }

        // We zoeken in Bestand 1 op de gemapte waarde (Kolom I / Index 8)
        const searchKey = String(row[8] || "").trim();
        const match = sourceMap.get(searchKey);

        if (match) {
            return [...row, match.valG, match.valH];
        } else {
            return [...row, "Geen match", "Geen match"];
        }
    });

    // Maak nieuw Excel bestand
    const ws = XLSX.utils.aoa_to_sheet(updatedRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultaat");
    
    // Download
    XLSX.writeFile(wb, "Gemaatst_Bestand.xlsx");
}