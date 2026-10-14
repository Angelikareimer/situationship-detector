# Situationship Detector

Interaktiver Lead-Magnet für The Magnetic Femme. Die Seite läuft auf Vercel und übergibt Opt-ins anhand des Quiz-Ergebnisses an drei getrennte Kajabi-Formulare.

## Ergebnis → Kajabi-Formular

- S1 – Nähe ohne Klarheit: `2149753334`
- S2 – Zuneigung ohne Entscheidung: `2149753333`
- S3 – Du weißt es längst: `2149753335`

## Lokal starten

Für die statische Vorschau:

```bash
python3 -m http.server 4173
```

Für den kompletten Ablauf inklusive `/api/kajabi-optin`:

```bash
vercel dev
```

## Live-Domain

`https://detector.themagneticfemme.co`
