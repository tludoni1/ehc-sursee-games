// fetch-games.js
import fs from "fs";
import fetch from "node-fetch";

const DEBUG = true; // bei Bedarf auf false setzen
const SAISON = 2026;
const DATE_FROM = "01.08.2025";
const DATE_TO = "30.04.2026";

// --> erweiterte searchQuery: Nachwuchs + Aktivligen
const searchQuery =
  "1,10,11/2015-2099/3,10,18,19,33,35,36,37,38,39,40,41,43,44,45,46,83,101,104,105,106,107,113,114,115,116,117,118,119,120,121,122,123,124,125";

// Teams definieren
const teams = [
  { name: "EHC Sursee U21 A", leagueId: 115, teamId: 105774 },
  { name: "EHC Sursee U18 A", leagueId: 118, teamId: 104511 },
  { name: "EHC Sursee U16 A", leagueId: 121, teamId: 103984 },
  { name: "EHC Sursee U14 Top", leagueId: 123, teamId: 105957 },
  { name: "EHC Sursee U14 A", leagueId: 124, teamId: 105514 },
  { name: "EHC Sursee 1. Mannschaft", leagueId: 10, teamId: 103941 },
  { name: "EHC Sursee 2. Mannschaft", leagueId: 19, teamId: 104319 },
  { name: "EHC Sursee Damen", leagueId: 43, teamId: 103700 },
  { name: "EHC Sursee Senioren", leagueId: 37, teamId: 105810 },
];

// Hilfsfunktion: JSONP bereinigen
function parseJSONP(text) {
  try {
    const json = text.replace(/^\/\*\*\/\s*[^()]+\(|\);?$/g, "");
    return JSON.parse(json);
  } catch (err) {
    if (DEBUG) {
      fs.writeFileSync("debug-error.json", text);
    }
    throw err;
  }
}

async function fetchGames() {
  let allGames = [];
  let debugDump = {};

  console.log("Hole Daten von SIHF...");

  for (const team of teams) {
    console.log(`--> ${team.name}`);
    const url = `https://data.sihf.ch/Statistic/api/cms/cache300?alias=results&searchQuery=${searchQuery}&filterQuery=${SAISON}/${team.leagueId}/all/all/${DATE_FROM}-${DATE_TO}/all/${team.teamId}/all&orderBy=date&orderByDescending=false&take=200&filterBy=season,league,region,phase,date,deferredState,team1,team2&callback=externalStatisticsCallback&skip=-1&language=de`;

    try {
      const res = await fetch(url);
      const text = await res.text();
      const data = parseJSONP(text);

      debugDump[team.name] = data;

      if (data && data.results) {
        data.results.forEach((game) => {
          // nur Spiele mit Sursee berücksichtigen
          if (
            game.team1?.id === team.teamId ||
            game.team2?.id === team.teamId
          ) {
            allGames.push({
              saison: SAISON,
              team: team.name,
              leagueId: team.leagueId,
              date: game.date,
              team1: game.team1,
              team2: game.team2,
              result: game.result,
              gameId: game.gameId,
              today: game.today,
              place: game.place,
            });
          }
        });
      }
    } catch (err) {
      console.error(`Fehler bei ${team.name}:`, err.message);
    }
  }

  if (DEBUG) {
    fs.writeFileSync("debug.json", JSON.stringify(debugDump, null, 2));
    console.log("Debug-Daten in debug.json gespeichert.");
  }

  fs.writeFileSync("games.json", JSON.stringify(allGames, null, 2));
  console.log(`Fertig! ${allGames.length} Spiele gespeichert in games.json`);
}

fetchGames();
