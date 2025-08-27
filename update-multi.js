import { execSync } from "child_process";

const seasons = [2020, 2021, 2022, 2023, 2024, 2025];

for (const year of seasons) {
  console.log(`Starte Update für Saison ${year}...`);
  try {
    execSync(`node update-all.js ${year}`, { stdio: "inherit" });
  } catch (err) {
    console.error(`Fehler bei Saison ${year}:`, err.message);
  }
}

console.log("Alle Saisons generiert!");
