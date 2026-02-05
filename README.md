# CSV Processor

Dit programma verwerkt twee CSV-bestanden om kolommen toe te voegen op basis van mapping.

## Gebruik

1. Upload Bestand 1 (het goede bestand met MODEL en Bestnr/variant kolommen) - CSV of XLSX.
2. Upload Bestand 2 (het niet-goede bestand met ARTIKELNAAM, C, D, G, H kolommen) - CSV of XLSX.
3. Klik op "Verwerk Bestanden".
4. Download het resulterende CSV-bestand.

## Verwerking

- Voor XLSX-bestanden worden alle tabbladen (bladen) meegenomen en samengevoegd.
- In Bestand 2 worden kolommen C en D samengevoegd met een spatie in een nieuwe kolom I.
- Mapping gebeurt op ARTIKELNAAM + kolom I (van Bestand 2) en MODEL + Bestnr/variant (van Bestand 1).
- Voor overeenkomende rijen worden kolommen G en H van Bestand 2 toegevoegd aan Bestand 1.

## Uitvoeren

Start een lokale server:
```
python3 -m http.server 8000
```

Open http://localhost:8000 in je browser.