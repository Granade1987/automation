function parseFile(file, callback) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = e.target.result;
        if (file.name.endsWith('.xlsx')) {
            const workbook = XLSX.read(data, {type: 'binary'});
            const allData = [];
            workbook.SheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet, {header: 1});
                if (json.length > 0) {
                    const headers = json[0];
                    const rows = json.slice(1).map(row => {
                        const obj = {};
                        headers.forEach((header, index) => {
                            obj[header] = row[index] || '';
                        });
                        return obj;
                    });
                    allData.push(...rows);
                }
            });
            callback({data: allData});
        } else {
            Papa.parse(data, {
                header: true,
                complete: callback
            });
        }
    };
    if (file.name.endsWith('.xlsx')) {
        reader.readAsBinaryString(file);
    } else {
        reader.readAsText(file);
    }
}

document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];
    const onlyFile2 = document.getElementById('onlyFile2').checked;
    
    if (!file2) {
        alert('Selecteer bestand 2.');
        return;
    }
    
    if (onlyFile2) {
        // Alleen bestand 2 verwerken
        parseFile(file2, function(results2) {
            if (results2.data.length > 0) {
                alert('Bestand 2 eerste rij keys: ' + Object.keys(results2.data[0]).join(', '));
                alert('Bestand 2 eerste rij waarden: ' + JSON.stringify(results2.data[0]));
            }
            const newData = results2.data.map(row => {
                // Kolom C is index 2, D index 3
                const cVal = row[2] || row.C || '';
                const dVal = row[3] || row.D || '';
                if (cVal && dVal) {
                    row.I = cVal.trim() + ' ' + dVal.trim();
                }
                return row;
            });
            
            if (newData.length > 0) {
                alert('Nieuwe data eerste rij: ' + JSON.stringify(newData[0]));
            }
            
            const csv = Papa.unparse(newData);
            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const link = document.getElementById('downloadLink');
            link.href = url;
            link.style.display = 'block';
            link.textContent = 'Download Verwerkt Bestand 2 (met kolom I)';
        });
    } else {
        // Mapping doen
        if (!file1) {
            alert('Selecteer bestand 1.');
            return;
        }
        
        // Lees bestand 2 eerst
        parseFile(file2, function(results2) {
            // Verwerk bestand 2
            const map = {};
            results2.data.forEach(row => {
                const cVal = row[2] || row.C || '';
                const dVal = row[3] || row.D || '';
                if (cVal && dVal) {
                    const kolomI = cVal.trim() + ' ' + dVal.trim();
                    row.I = kolomI;  // Voeg kolom I toe
                    const artVal = row[1] || row.B || '';
                    const key = artVal.trim().toLowerCase() + kolomI.toLowerCase();
                    const gVal = row[6] || row.G || '';
                    const hVal = row[7] || row.H || '';
                    map[key] = {
                        G: gVal,
                        H: hVal
                    };
                }
            });
            
            alert('Aantal entries in map: ' + Object.keys(map).length);
            if (Object.keys(map).length > 0) {
                alert('Voorbeeld keys uit map: ' + Object.keys(map).slice(0, 3).join(', '));
            }
            
            if (results2.data.length > 0) {
                const row = results2.data[0];
                const cVal = row[2] || row.C || '';
                const dVal = row[3] || row.D || '';
                const kolomI = cVal.trim() + ' ' + dVal.trim();
                alert('Bestand 2 eerste rij: B/index1=' + (row[1] || row.B) + ', C/index2=' + cVal + ', D/index3=' + dVal + ', kolomI=' + kolomI + ', I=' + row.I);
            }
            
            // Lees bestand 1
            parseFile(file1, function(results1) {
                alert('Aantal rijen in bestand 1: ' + results1.data.length);
                
                if (results1.data.length > 0) {
                    const row = results1.data[0];
                    alert('Bestand 1 eerste rij: D/index3=' + (row[3] || row.D) + ', E/index4=' + (row[4] || row.E));
                }
                
                // Verwerk bestand 1
                const newData = results1.data.map(row => {
                    const modelVal = row[3] || row.D || '';
                    const varVal = row[4] || row.E || '';
                    const key = modelVal.trim().toLowerCase() + varVal.trim().toLowerCase();
                    if (map[key]) {
                        row.G = map[key].G;
                        row.H = map[key].H;
                    }
                    return row;
                });
                
                alert('Aantal matches: ' + newData.filter(row => row.G).length);
                
                // Maak nieuwe CSV
                const csv = Papa.unparse(newData);
                
                // Download link
                const blob = new Blob([csv], { type: 'text/csv' });
                const url = URL.createObjectURL(blob);
                const link = document.getElementById('downloadLink');
                link.href = url;
                link.style.display = 'block';
                link.textContent = 'Download Resultaat CSV';
            });
        });
    }
});