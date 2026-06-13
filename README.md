# ehc-sursee-games

Automatischer Export der SIHF-Spielpläne (Aktiv- und Nachwuchsteams) für den EHC Sursee.

Die Skripte rufen die Spielpläne von der SIHF-API ab, speichern sie als JSON (`games-aktiv.json`, `games-nachwuchs.json`, `games-all.json`) und stellen ein Widget (`games-widget-core.js` / `games-widget-loader.js`) bereit, um die Spielpläne auf einer Website einzubinden.

## Nutzung

```bash
npm start   # ruft update-all.js für die aktuelle Saison auf
```

- `fetch-games-aktive.js` – Spielplan Aktivteams
- `fetch-games-nachwuchs.js` – Spielplan Nachwuchsteams
- `update-all.js` / `update-multi.js` – Orchestrierung für eine bzw. mehrere Saisons
