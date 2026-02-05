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
    
    if (!file1 || !file2) {
        alert('Selecteer beide bestanden.');
        return;
    }
    
    // Lees bestand 2 eerst
    parseFile(file2, function(results2) {
        // Verwerk bestand 2
        const map = {};
        results2.data.forEach(row => {
            if (row.C && row.D) {
                const kolomI = (row.C || '').trim() + ' ' + (row.D || '').trim();
                const key = (row.B || '').trim().toLowerCase() + kolomI.toLowerCase();
                map[key] = {
                    G: row.G || '',
                    H: row.H || ''
                };
            }
        });
        
        alert('Aantal entries in map: ' + Object.keys(map).length);
        if (Object.keys(map).length > 0) {
            alert('Voorbeeld keys uit map: ' + Object.keys(map).slice(0, 3).join(', '));
        }
        
        // Lees bestand 1
        parseFile(file1, function(results1) {
            alert('Aantal rijen in bestand 1: ' + results1.data.length);
            if (results1.data.length > 0) {
                const exampleKey = (results1.data[0].D || '').trim().toLowerCase() + (results1.data[0].E || '').trim().toLowerCase();
                alert('Voorbeeld key uit bestand 1: ' + exampleKey);
            }
            
            // Verwerk bestand 1
            const newData = results1.data.map(row => {
                const key = (row.D || '').trim().toLowerCase() + (row.E || '').trim().toLowerCase();
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
});