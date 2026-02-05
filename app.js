document.getElementById('processBtn').addEventListener('click', async () => {
    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];

    if (!file1 || !file2) {
        alert("Upload aUB beide bestanden.");
        return;
    }

    // Functie om bestand te lezen naar JSON
    const readSheet = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { header: 1 });
                resolve(data);
            };
            reader.readAsBinaryString(file);
        });
    };

    const data1 = await readSheet(file1);
    const data2 = await readSheet(file2);

    // Stap 1: Bestand 2 bewerken (C+D samenvoegen in Kolom I)
    // Index: C=2, D=3, G=6, H=7, I=8
    const mappingStore = {};
    data2.forEach((row, index) => {
        if (index === 0) return; // Skip header
        const valC = row[2] || "";
        const valD = row[3] || "";
        const key = `${valC} ${valD}`.trim(); // De nieuwe Kolom I waarde
        
        // Sla G en H op onder deze sleutel
        mappingStore[key] = {
            colG: row[6],
            colH: row[7]
        };
    });

    // Stap 2: Bestand 1 mappen
    // We gaan ervan uit dat de "Sleutel" in Bestand 1 in een kolom staat die matcht met "Titel Kleur"
    // Voor dit voorbeeld nemen we aan dat die sleutel in Kolom A (index 0) van Bestand 1 staat.
    const resultaat = data1.map((row, index) => {
        if (index === 0) {
            // Headers toevoegen
            return [...row, "Toegevoegd G", "Toegevoegd H"];
        }
        
        const sleutelBestand1 = row[0]; // PAS DIT AAN: Welke kolom in B1 is de match?
        const match = mappingStore[sleutelBestand1];

        if (match) {
            return [...row, match.colG, match.colH];
        } else {
            return [...row, "", ""]; // Leeg laten als er geen match is
        }
    });

    // Stap 3: Exporteren
    const newSheet = XLSX.utils.aoa_to_sheet(resultaat);
    const newWorkbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Resultaat");
    XLSX.writeFile(newWorkbook, "bijgewerkt_bestand.xlsx");
});