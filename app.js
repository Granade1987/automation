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
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const workbook = XLSX.read(e.target.result, { type: 'binary' });
                const allData = {};
                workbook.SheetNames.forEach(name => {
                    allData[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 });
                });
                resolve(allData);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Kan bestand niet lezen'));
        reader.readAsBinaryString(file);
    });
}

async function prepareSource() {
    try {
        const fileInput = document.getElementById('upload2');
        if (!fileInput.files[0]) {
            alert('Selecteer bestand 2!');
            return;
        }
        
        console.log('Bestand 2 geselecteerd, bestand naam:', fileInput.files[0].name);
        
        const allSheets = await readAllSheets(fileInput.files[0]);
        console.log('Sheets gelezen:', Object.keys(allSheets));
        sourceDataMap.clear();
        
        for (const name in allSheets) {
            const rows = allSheets[name];
            console.log('Verwerking sheet:', name, 'aantal rijen:', rows.length);
            rows.forEach((row, i) => {
                if (i < 1 || !row || row.length < 5) return; 

                // BRON (Bestand 2): 
                // Artikelnaam = index 1, Kleur = index 3
            const artVal = String(row[1] || '');
            const cVal = String(row[2] || '');
            const dVal = String(row[3] || '');
                
                const fVal = String(row[5] || ''); 
                const gVal = String(row[6] || ''); 

                if (key) {
                    sourceDataMap.set(key, { f: fVal, g: gVal });
                }
            });
        }
        alert(`Klaar! ${sourceDataMap.size} unieke producten opgeslagen.`);
        console.log('Map size:', sourceDataMap.size);
        document.getElementById('step2').classList.remove('disabled');
    } catch (error) {
        console.error('Fout in prepareSource:', error);
        alert('Fout: ' + error.message);
    }
}

async function mapAndDownload() {
    try {
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
                    h[7] = "Kolom F"; 
                    h[8] = "Kolom G";
                    return h;
                }
                
                const dVal = String(row[3] || '');
                const eVal = String(row[4] || '');
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
    } catch (error) {
        console.error('Fout in mapAndDownload:', error);
        alert('Fout: ' + error.message);
    }
}