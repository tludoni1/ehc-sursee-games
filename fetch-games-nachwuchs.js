// fetch-games-nachwuchs.js
import fetch from "node-fetch";
import fs from "fs";

const DEBUG = false;

// Saison aus Parameter lesen
const SAISON = parseInt(process.argv[2] || "2026", 10);

// Zeitraum: Saisonstart (Aug -> nächstes Jahr April)
const DATE_FROM = `01.08.${SAISON - 1}`;
const DATE_TO   = `30.04.${SAISON}`;

// Teams Nachwuchs
const TEAMS = [
  { name: "EHC Sursee U21 A", leagueId: 115, teamId: 105774 },
  { name: "EHC Sursee U18 A", leagueId: 118, teamId: 104511 },
  { name: "EHC Sursee U16 A", leagueId: 121, teamId: 103984 },
  { name: "EHC Sursee U14 Top", leagueId: 123, teamId: 105957 },
  { name: "EHC Sursee U14 A", leagueId: 124, teamId: 105514 },
];

async function fetchGames(team) {
  const url = `https://data.sihf.ch/Statistic/api/cms/cache300?alias=results&searchQuery=1,10,11/2015-2099/4,5,14,15,16,23,24,25,26,28,27,29,30,31,32,60,61,105,106,107,113,114,115,116,117,118,119,120,121,122,123,124,125&filterQuery=${SAISON}/${team.leagueId}/all/all/${DATE_FROM}-${DATE_TO}/all/${team.teamId}/all&orderBy=date&orderByDescending=false&take=200&filterBy=season,league,region,phase,date,deferredState,team1,team2&callback=externalStatisticsCallback&skip=-1&language=de`;
  
  try {
    const res = await fetch(url);
    const text = await res.text();

    if (DEBUG) fs.appendFileSync(`debug-nachwuchs-${SAISON}.json`, `\n\n=== ${team.name} ===\n${text}`);

    let cleanText = text.trim().replace(/^.*?\(/, "").replace(/\);?$/, "");
    const json = JSON.parse(cleanText);
    if (!json?.data) return [];

    const games = [];
    json.data.forEach((row) => {
      const game = {
        saison: SAISON,
        team: team.name,
        leagueId: team.leagueId,
        date: null,
        longDate: null,
        result: "-",
        displayInfo: null,
        team1: null,
        team2: null,
        gameId: null,
        place: null,
      };

      let dateStr = null;
      let timeStr = null;

      row.forEach((cell) => {
        if (typeof cell === "string" && /\d{2}\.\d{2}\.\d{4}/.test(cell)) {
          dateStr = cell;
          game.date = cell;
        } else if (typeof cell === "string" && /^\d{2}:\d{2}$/.test(cell)) {
          timeStr = cell;
        } else if (cell?.type === "team" && !game.team1) {
          game.team1 = { id: cell.id, name: cell.name };
        } else if (cell?.type === "team" && !game.team2) {
          game.team2 = { id: cell.id, name: cell.name };
        } else if (cell?.type === "result") {
          if (cell.homeTeam === "-" && cell.awayTeam === "-") {
            game.result = "-";
          } else {
            game.result = `${cell.homeTeam}:${cell.awayTeam}`;
          }
        } else if (cell?.type === "linkToGameDetail") {
          game.gameId = cell.gameId;
        }
      });

      // longDate
      if (dateStr) {
        const [d, m, y] = dateStr.split(".");
        const months = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
        const dateObj = new Date(`${y}-${m}-${d}T${timeStr || "00:00"}`);
        const monthName = months[dateObj.getMonth()];
        game.longDate = `${parseInt(d)}. ${monthName} ${y}${timeStr ? ` - ${timeStr}` : ""}`;
      }

      game.displayInfo = game.result !== "-" ? game.result : game.longDate;
      game.place = game.team1?.id === team.teamId ? "home" : "away";

      games.push(game);
    });
    return games;
  } catch (err) {
    console.error(`Fehler bei ${team.name}: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log(`Hole Nachwuchs-Daten Saison ${SAISON} von SIHF...`);
  if (DEBUG) fs.writeFileSync(`debug-nachwuchs-${SAISON}.json`, "");

  const allGames = [];
  for (const team of TEAMS) {
    console.log(`--> ${team.name}`);
    const games = await fetchGames(team);
    allGames.push(...games);
  }

  const outFile = `games-nachwuchs-${SAISON}.json`;
  fs.writeFileSync(outFile, JSON.stringify(allGames, null, 2));
  console.log(`✅ Fertig! ${allGames.length} Nachwuchs-Spiele gespeichert in ${outFile}`);
}

main();
