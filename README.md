# CSV Processor

Dit programma verwerkt twee CSV-bestanden om kolommen toe te voegen op basis van mapping.

## Gebruik

1. **Stap 1: Bestand 2 verwerken**  
   Upload alleen bestand 2, vink "Alleen bestand 2 verwerken" aan, en klik Verwerk. Download het verwerkte bestand 2 met kolom I toegevoegd.

2. **Stap 2: Mapping**  
   Upload beide bestanden, vink de checkbox uit, en klik Verwerk voor de volledige mapping en download van het resultaat.

## Verwerking

- Voor XLSX-bestanden worden alle tabbladen (bladen) meegenomen en samengevoegd.
- In Bestand 2 worden kolommen C en D samengevoegd met een spatie in een nieuwe kolom I.
- Mapping gebeurt op kolom B (ARTIKELNAAM) + kolom I (van Bestand 2) en kolom D (MODEL) + kolom E (Bestnr/variant) (van Bestand 1).
- Voor overeenkomende rijen worden kolommen G en H van Bestand 2 toegevoegd aan Bestand 1.

## Uitvoeren

Start een lokale server:
```
python3 -m http.server 8000
```

Open http://localhost:8000 in je browser.