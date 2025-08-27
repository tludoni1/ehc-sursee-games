// update-all.js
import { execSync } from "child_process";
import fs from "fs";

// Saison aus Parameter oder automatisch berechnen
function getCurrentSeason() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // JS: 0 = Januar

  // Mai–Dezember -> nächste Saison
  if (month >= 5) return year + 1;

  // Januar–April -> aktuelle Saison
  return year;
}

const SAISON = process.argv[2] ? parseInt(process.argv[2], 10) : getCurrentSeason();
if (isNaN(SAISON)) {
  console.error("❌ Ungültiger Saison-Parameter. Beispiel: node update-all.js 2024");
  process.exit(1);
}

console.log(`🔄 Starte Update für Saison ${SAISON}...`);

function run(cmd) {
  try {
    console.log(`➡️  ${cmd}`);
    execSync(cmd, { stdio: "inherit" });
  } catch (err) {
    console.error(`❌ Fehler bei Befehl: ${cmd}`, err.message);
    process.exit(1);
  }
}

// Schritt 1: Nachwuchs holen
run(`node fetch-games-nachwuchs.js ${SAISON}`);

// Schritt 2: Aktiv holen
run(`node fetch-games-aktive.js ${SAISON}`);

// Schritt 3: Zusammenführen
const nachwuchsFile = `games-nachwuchs-${SAISON}.json`;
const aktivFile = `games-aktiv-${SAISON}.json`;
const outFile = `games-all-${SAISON}.json`;

let allGames = [];

try {
  const nachwuchs = JSON.parse(fs.readFileSync(nachwuchsFile, "utf-8"));
  allGames = allGames.concat(nachwuchs);
} catch {
  console.warn(`⚠️  Konnte ${nachwuchsFile} nicht laden oder Datei leer.`);
}

try {
  const aktiv = JSON.parse(fs.readFileSync(aktivFile, "utf-8"));
  allGames = allGames.concat(aktiv);
} catch {
  console.warn(`⚠️  Konnte ${aktivFile} nicht laden oder Datei leer.`);
}

// Speichern
fs.writeFileSync(outFile, JSON.stringify(allGames, null, 2));
console.log(`✅ Fertig! ${allGames.length} Spiele gespeichert in ${outFile}`);
