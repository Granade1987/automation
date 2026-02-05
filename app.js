let sourceMap = new Map();

/**
 * Hulpfunctie om Excel/CSV om te zetten naar een Array van rijen
 */
async function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target.result;
            const workbook = XLSX.read(data, { type: 'binary' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            // header: 1 zorgt voor een array van arrays (rijen)
            resolve(XLSX.utils.sheet_to_json(worksheet, { header: 1 }));
        };
        reader.onerror = reject;
        reader.readAsBinaryString(file);
    });
}

/**
 * STAP 1: Bestand 2 inlezen, C+D samenvoegen en preview tonen
 */
async function prepareSource() {
    const fileInput = document.getElementById('upload2');
    if (!fileInput.files[0]) return alert("Selecteer eerst bestand 2!");

    try {
        const rows = await readFile(fileInput.files[0]);
        sourceMap.clear();
        const previewBody = document.getElementById('previewBody');
        previewBody.innerHTML = ''; 

        let processedCount = 0;

        // Loop door rijen, begin bij 1 (overslaan header)
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            if (!row || row.length < 3) continue;

            const colC = String(row[2] || "").trim();
            const colD = String(row[3] || "").trim();
            const keyI = `${colC} ${colD}`.trim();
            
            const valG = row[6] || "";
            const valH = row[7] || "";

            if (keyI !== "") {
                sourceMap.set(keyI, { valG, valH });
                processedCount++;

                // Toon eerste 10 rijen in de preview
                if (processedCount <= 10) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td>${colC}</td>
                        <td>${colD}</td>
                        <td class="highlight">${keyI}</td>
                        <td>${valG}</td>
                        <td>${valH}</td>
                    `;
                    previewBody.appendChild(tr);
                }
            }
        }

        document.getElementById('matchCount').innerText = `✅ ${processedCount} unieke sleutels gegenereerd uit Bestand 2.`;
        document.getElementById('previewContainer').style.display = 'block';
        document.getElementById('step2').classList.remove('disabled');
        
    } catch (error) {
        console.error(error);
        alert("Er ging iets mis bij het lezen van Bestand 2.");
    }
}

/**
 * STAP 2: Bestand 1 inlezen en mappen op basis van Kolom I
 */
async function mapAndDownload() {
    const fileInput = document.getElementById('upload1');
    if (!fileInput.files[0]) return alert("Selecteer eerst bestand 1!");

    try {
        const rows = await readFile(fileInput.files[0]);
        
        const updatedRows = rows.map((row, index) => {
            // Header rij van Bestand 1 uitbreiden
            if (index === 0) {
                return [...row, "Toegevoegd_G (Bron)", "Toegevoegd_H (Bron)"];
            }

            // Zoekwaarde in Bestand 1 zit in Kolom I (index 8)
            const searchKey = String(row[8] || "").trim();
            const match = sourceMap.get(searchKey);

            if (match) {
                return [...row, match.valG, match.valH];
            } else {
                return [...row, "GEEN MATCH", "GEEN MATCH"];
            }
        });

        // Maak een nieuwe sheet en download
        const ws = XLSX.utils.aoa_to_sheet(updatedRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Gemapped_Resultaat");
        
        XLSX.writeFile(wb, "Resultaat_Mapping.xlsx");
        
    } catch (error) {
        console.error(error);
        alert("Er ging iets mis bij het verwerken van Bestand 1.");
    }
}