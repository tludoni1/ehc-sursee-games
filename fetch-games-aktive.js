// fetch-games-aktiv.js
import fetch from "node-fetch";
import fs from "fs";

const DEBUG = false; // auf true für Debug-Infos stellen

// Saison aus Parameter lesen (z.B. "node fetch-games-aktiv.js 2026")
const SAISON = parseInt(process.argv[2] || "2026", 10);

// Zeitraum
const DATE_FROM = `01.08.${SAISON - 1}`;
const DATE_TO = `30.04.${SAISON}`;

// Teams Aktiv
const TEAMS = [
  { name: "EHC Sursee 1. Mannschaft", leagueId: 10, teamId: 103941 },
  { name: "EHC Sursee Damen", leagueId: 43, teamId: 103700 },
  { name: "EHC Sursee 2. Mannschaft", leagueId: 19, teamId: 104319 },
  { name: "EHC Sursee Senioren D", leagueId: 37, teamId: 105810 },
];

async function fetchGames(team) {
  const url = `https://data.sihf.ch/Statistic/api/cms/cache300?alias=results&searchQuery=1,10/2015-2099/3,10,18,19,33,35,36,38,37,39,40,41,43,101,44,45,46,104,83&filterQuery=${SAISON}/${team.leagueId}/all/all/${DATE_FROM}-${DATE_TO}/all/${team.teamId}/all&orderBy=date&orderByDescending=false&take=200&filterBy=season,league,region,phase,date,deferredState,team1,team2&callback=externalStatisticsCallback&skip=-1&language=de`;

  try {
    const res = await fetch(url);
    const text = await res.text();

    if (DEBUG) {
      fs.appendFileSync("debug-aktiv.json", `\n\n=== ${team.name} ===\n${text}`);
    }

    // JSONP entfernen
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

      // longDate bauen
      if (dateStr) {
        const [d, m, y] = dateStr.split(".");
        const months = ["Jan.", "Feb.", "März", "Apr.", "Mai", "Juni", "Juli", "Aug.", "Sep.", "Okt.", "Nov.", "Dez."];
        const dateObj = new Date(`${y}-${m}-${d}T${timeStr || "00:00"}`);
        const monthName = months[dateObj.getMonth()];
        game.longDate = `${parseInt(d)}. ${monthName} ${y}${timeStr ? ` - ${timeStr}` : ""}`;
      }

      // displayInfo
      game.displayInfo = game.result !== "-" ? game.result : game.longDate;

      // Heim/Auswärts
      if (game.team1?.id === team.teamId) {
        game.place = "home";
      } else if (game.team2?.id === team.teamId) {
        game.place = "away";
      }

      games.push(game);
    });

    return games;
  } catch (err) {
    console.error(`Fehler bei ${team.name}: ${err.message}`);
    return [];
  }
}

async function main() {
  console.log("Hole Aktiv-Daten von SIHF...");
  if (DEBUG) fs.writeFileSync("debug-aktiv.json", ""); // Reset Debugfile

  const allGames = [];

  for (const team of TEAMS) {
    console.log(`--> ${team.name}`);
    const games = await fetchGames(team);
    allGames.push(...games);
  }

  fs.writeFileSync("games-aktiv.json", JSON.stringify(allGames, null, 2));
  console.log(`Fertig! ${allGames.length} Aktiv-Spiele gespeichert in games-aktiv.json`);
}

main();
