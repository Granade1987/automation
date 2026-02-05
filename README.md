# Excel Processor

Dit programma voegt kolommen toe aan een Excel-bestand op basis van mapping met een ander bestand.

## Verwerking

- **Bestand 2** wordt gebruikt als bron: kolommen C en D worden samengevoegd met spatie in een interne kolom I.
- Mapping gebeurt op: Bestand 1 kolom D + kolom E tegen Bestand 2 kolom B + kolom I.
- Bij match worden kolommen F en G uit Bestand 2 toegevoegd aan Bestand 1 als nieuwe kolommen H en I.

## Gebruik

Upload beide bestanden en klik op de knoppen om te verwerken.

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