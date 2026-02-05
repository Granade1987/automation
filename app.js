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
        // Toon debug venster
        document.getElementById('debugCard').style.display = 'block';
        document.getElementById('debugLog').innerHTML = '';
        
        const fileInput = document.getElementById('upload2');
        if (!fileInput.files[0]) {
            alert('Selecteer bestand 2!');
            return;
        }
        
        log('📂 Bestand 2 geselecteerd: ' + fileInput.files[0].name);
        
        const allSheets = await readAllSheets(fileInput.files[0]);
        log('📊 Sheets gelezen: ' + Object.keys(allSheets).join(', '));
        sourceDataMap.clear();
        
        for (const name in allSheets) {
            const rows = allSheets[name];
            log('🔄 Sheet "' + name + '": ' + rows.length + ' rijen');
            rows.forEach((row, i) => {
                if (i < 1 || !row || row.length < 5) return; 

                // BRON (Bestand 2): 
                // Artikelnaam = index 1, Kleur = index 3
                const artVal = String(row[1] || '');
                const cVal = String(row[2] || '');
                const dVal = String(row[3] || '');
                const kolomI = cVal.trim() + ' ' + dVal.trim();
                const key = artVal.trim().toLowerCase() + kolomI.toLowerCase();
                
                const fVal = String(row[5] || ''); 
                const gVal = String(row[6] || ''); 

                if (key) {
                    sourceDataMap.set(key, { f: fVal, g: gVal });
                }
            });
        }
        log('✅ Klaar! ' + sourceDataMap.size + ' unieke combinaties opgeslagen.');
        alert(`Klaar! ${sourceDataMap.size} unieke producten opgeslagen.`);
        document.getElementById('step2').classList.remove('disabled');
    } catch (error) {
        log('ERROR:' + error.message); // , error);
        alert('Fout: ' + error.message);
    }
}

async function mapAndDownload() {
    try {
        // Toon debug venster
        document.getElementById('debugCard').style.display = 'block';
        document.getElementById('debugLog').innerHTML = '';
        
        const fileInput = document.getElementById('upload1');
        if (!fileInput.files[0]) {
            alert('Selecteer bestand 1!');
            return;
        }
        
        log('📂 Bestand 1 geselecteerd: ' + fileInput.files[0].name);
        const allSheets = await readAllSheets(fileInput.files[0]);
        const newWorkbook = XLSX.utils.book_new();
        
        log('🔗 Start mapping met ' + sourceDataMap.size + ' opgeslagen combinaties...');
        let matches = 0;

        for (const name in allSheets) {
            const rows = allSheets[name];
            const updated = [];
            log('📋 Sheet "' + name + '": verwerking...');
            
            // Voeg header toe
            if (rows.length > 0) {
                let h = [...rows[0]];
                h[7] = "Prijs (€)"; 
                h[8] = "Korting (%)";
                updated.push(h);
            }
            
            // Voeg alleen rijen met matches toe
            for (let i = 1; i < rows.length; i++) {
                const row = rows[i];
                if (!row) continue;
                
                const dVal = String(row[3] || '');
                const eVal = String(row[4] || '');
                const key = dVal.trim().toLowerCase() + eVal.trim().toLowerCase();
                
                const match = sourceDataMap.get(key);
                
                // Alleen toevoegen als er een match is (kolom F en G gevuld)
                if (match) {
                    matches++;
                    let newRow = [...row];
                    while (newRow.length < 9) newRow.push("");
                    
                    // Kolom H: EUROS, Kolom I: PROCENTEN
                    newRow[7] = '€' + String(match.f).replace('.', ',');
                    // Vermenigvuldig percentage met 100 (0.5 wordt 50%)
                    newRow[8] = (parseFloat(match.g) * 100) + '%';
                    
                    updated.push(newRow);
                }
            }
            log('✔️ Sheet "' + name + '": ' + (updated.length - 1) + ' matches');

            const ws = XLSX.utils.aoa_to_sheet(updated);
            XLSX.utils.book_append_sheet(newWorkbook, ws, name);
        }

        log('🎉 Totaal ' + matches + ' matches gevonden en geexporteerd!');
        alert(`Klaar! ${matches} matches gevonden.`);
        XLSX.writeFile(newWorkbook, "Resultaat_Mapping.xlsx");
    } catch (error) {
        log('ERROR: ' + error.message);
        alert('Fout: ' + error.message);
    }
}