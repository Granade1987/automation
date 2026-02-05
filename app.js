let sourceDataMap = new Map();

function log(msg) {
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
    
    document.getElementById('debugCard').style.display = 'block';
    document.getElementById('debugLog').innerHTML = ""; 
    log("Bronbestand analyseren op Productnaam + Kleur...");
    
    const allSheets = await readAllSheets(fileInput.files[0]);
    sourceDataMap.clear();
    
    for (const name in allSheets) {
        const rows = allSheets[name];
        rows.forEach((row, i) => {
            if (i < 1 || !row || row.length < 5) return; 

            // BRON (Bestand 2): 
            // Artikelnaam = index 1, Kleur = index 3
            // Sale prijs = index 5, Percentage = index 6
            const naam = superClean(row[1]);
            const kleur = superClean(row[3]);
            const tekstSleutel = naam + kleur;
            
            const salePrijs = row[5]; 
            const percentage = row[6]; 

            if (tekstSleutel) {
                // We slaan op basis van de tekst-combi op
                sourceDataMap.set(tekstSleutel, { salePrijs, percentage });
                
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
    const allSheets = await readAllSheets(fileInput.files[0]);
    const newWorkbook = XLSX.utils.book_new();
    
    log("Doelbestand mappen...");
    let matches = 0;

    for (const name in allSheets) {
        const rows = allSheets[name];
        const updated = rows.map((row, i) => {
            if (i === 0) {
                let h = [...row];
                h[7] = "Sale prijs"; h[8] = "Percentage";
                return h;
            }
            
            // DOEL (Bestand 1):
            // De tekst-combi staat in Kolom E (index 4)
            // Bijv: "oversized stamp t-shirt 2100 white"
            const infoB1 = superClean(row[4]); 
            
            const match = sourceDataMap.get(infoB1);

            let newRow = [...row];
            while (newRow.length < 9) newRow.push("");

            if (match) {
                matches++;
                newRow[7] = match.salePrijs;
                newRow[8] = match.percentage;
            }
            return newRow;
        });

        const ws = XLSX.utils.aoa_to_sheet(updated);
        XLSX.utils.book_append_sheet(newWorkbook, ws, name);
    }

    log(`Merge klaar! ${matches} matches gevonden op basis van productnaam.`);
    XLSX.writeFile(newWorkbook, "Croyez_Definitief_Mapped.xlsx");
}