// update-all.js
import { execSync } from "child_process";
import fs from "fs";

// Saison als Parameter übernehmen (z.B. "node update-all.js 2026")
const SAISON = process.argv[2] || "2026";

function runScript(cmd) {
  try {
    console.log(`Starte: ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error(`Fehler bei Befehl: ${cmd}`, err.message);
  }
}

async function main() {
  // Schritt 1: Nachwuchs
  runScript(`node fetch-games-nachwuchs.js ${SAISON}`);

  // Schritt 2: Aktiv
  runScript(`node fetch-games-aktive.js ${SAISON}`);

  // Schritt 3: Zusammenführen
  try {
    const nachwuchs = JSON.parse(fs.readFileSync("games-nachwuchs.json", "utf-8"));
    const aktiv = JSON.parse(fs.readFileSync("games-aktiv.json", "utf-8"));

    const allGames = [...nachwuchs, ...aktiv];

    fs.writeFileSync("games-all.json", JSON.stringify(allGames, null, 2));
    console.log(`✅ Fertig! ${allGames.length} Spiele in games-all.json gespeichert.`);
  } catch (err) {
    console.error("Fehler beim Zusammenführen:", err.message);
  }
}

main();
