document.getElementById('uploadForm').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const file1 = document.getElementById('file1').files[0];
    const file2 = document.getElementById('file2').files[0];
    
    if (!file1 || !file2) {
        alert('Selecteer beide bestanden.');
        return;
    }
    
    // Lees bestand 2 eerst
    const reader2 = new FileReader();
    reader2.onload = function(e) {
        const csv2 = e.target.result;
        Papa.parse(csv2, {
            header: true,
            complete: function(results2) {
                // Verwerk bestand 2
                const map = {};
                results2.data.forEach(row => {
                    if (row.C && row.D) {
                        const kolomI = row.C + ' ' + row.D;
                        const key = row.ARTIKELNAAM + kolomI;
                        map[key] = {
                            G: row.G || '',
                            H: row.H || ''
                        };
                    }
                });
                
                // Lees bestand 1
                const reader1 = new FileReader();
                reader1.onload = function(e) {
                    const csv1 = e.target.result;
                    Papa.parse(csv1, {
                        header: true,
                        complete: function(results1) {
                            // Verwerk bestand 1
                            const newData = results1.data.map(row => {
                                const key = row.MODEL + row['Bestnr/variant'];
                                if (map[key]) {
                                    row.G = map[key].G;
                                    row.H = map[key].H;
                                }
                                return row;
                            });
                            
                            // Maak nieuwe CSV
                            const csv = Papa.unparse(newData);
                            
                            // Download link
                            const blob = new Blob([csv], { type: 'text/csv' });
                            const url = URL.createObjectURL(blob);
                            const link = document.getElementById('downloadLink');
                            link.href = url;
                            link.style.display = 'block';
                            link.textContent = 'Download Resultaat CSV';
                        }
                    });
                };
                reader1.readAsText(file1);
            }
        });
    };
    reader2.readAsText(file2);
});