(async function () {
  // === Parameter lesen aus data-params im <script>-Tag ===
  const scriptTag = document.currentScript;
  const params = new URLSearchParams(scriptTag.getAttribute("data-params") || "");

  function getParam(key, defaultValue) {
    return params.get(key) !== null ? params.get(key) : defaultValue;
  }

  // === Parameter definieren ===
  const datasetTeams = getParam("teams", "all").split(",").map(t => t.trim().toLowerCase());
  const gamesBack = getParam("gamesBack", "all");
  const gamesNext = getParam("gamesNext", "all");
  const placeFilter = getParam("place", "all");

  const size = getParam("size", "normal"); // kompakt, normal, gross
  const showTeamName = getParam("teamName", "true") === "true";
  const showTeamLogo = getParam("teamLogo", "true") === "true";
  const gameLink = getParam("gameLink", "true") === "true";
  const todayFlag = getParam("todayFlag", "true") === "true";
  const color = getParam("color", "Farbe1"); // Farbe1-Farbe5
  const font = getParam("font", "Arial, sans-serif");

  // Farben von ehcsursee.ch (ungefähr ausgelesen)
  const COLORS = {
    Farbe1: { team: "#e2001a", date: "#000000", result: "#333333", line: "#cccccc", bg: "#ffffff", hover: "#f2f2f2" },
    Farbe2: { team: "#000000", date: "#e2001a", result: "#333333", line: "#cccccc", bg: "#ffffff", hover: "#ffe5e5" },
    Farbe3: { team: "#333333", date: "#000000", result: "#e2001a", line: "#cccccc", bg: "#ffffff", hover: "#f9f9f9" },
    Farbe4: { team: "#ffffff", date: "#ffffff", result: "#ffffff", line: "#e2001a", bg: "#e2001a", hover: "#b30014" },
    Farbe5: { team: "#000000", date: "#000000", result: "#000000", line: "#333333", bg: "#f8f8f8", hover: "#dddddd" },
  };
  const chosenColors = COLORS[color] || COLORS.Farbe1;

  // === Daten laden ===
  const res = await fetch("https://tludoni1.github.io/ehc-sursee-games/games-all.json");
  const games = await res.json();

  // === Filter anwenden ===
  const now = new Date();

  function parseDate(dateStr, timeStr) {
    const [d, m, y] = dateStr.split(".");
    return new Date(`${y}-${m}-${d}T${timeStr || "00:00"}`);
  }

  let filtered = games.filter(g => {
    // Teams filtern
    if (datasetTeams[0] !== "all") {
      const teamKey = g.team.toLowerCase();
      if (!datasetTeams.some(ds => teamKey.includes(ds))) return false;
    }

    // Place filtern
    if (placeFilter !== "all" && g.place !== placeFilter) return false;

    // Datum filtern
    const gameDate = parseDate(g.date, g.longDate.split("-")[1]?.trim());
    const diffDays = (gameDate - now) / (1000 * 60 * 60 * 24);

    if (gamesBack !== "all" && diffDays < -parseInt(gamesBack, 10)) return false;
    if (gamesNext !== "all" && diffDays > parseInt(gamesNext, 10)) return false;

    return true;
  });

  // Sortieren nach Datum
  filtered.sort((a, b) => {
    const d1 = parseDate(a.date, a.longDate.split("-")[1]?.trim());
    const d2 = parseDate(b.date, b.longDate.split("-")[1]?.trim());
    return d1 - d2;
  });

  // === Renderer ===
  function renderGames(games) {
    if (!games.length) return `<div style="font-family:${font};color:${chosenColors.date}">Keine Spiele gefunden</div>`;

    return `
      <style>
        .ehc-game { 
          display:flex; 
          justify-content:space-between; 
          align-items:center; 
          border-bottom:1px solid ${chosenColors.line};
          padding: ${size === "kompakt" ? "4px" : size === "gross" ? "12px" : "8px"};
          background:${chosenColors.bg};
          font-family:${font};
          transition: background 0.3s;
        }
        .ehc-game:hover { background:${chosenColors.hover}; }
        .ehc-team { display:flex; align-items:center; gap:6px; color:${chosenColors.team}; font-weight:600; }
        .ehc-date { color:${chosenColors.date}; font-size:${size === "kompakt" ? "12px" : size === "gross" ? "18px" : "14px"}; }
        .ehc-result { color:${chosenColors.result}; font-weight:bold; min-width:40px; text-align:center; }
        .ehc-flag { color:red; margin-left:6px; }
        .ehc-logo { width:${size === "gross" ? "36px" : size === "kompakt" ? "18px" : "24px"}; height:auto; }
      </style>
      ${games
        .map(g => {
          const linkStart = gameLink ? `<a href="https://www.sihf.ch/de/game-center/game/${g.gameId}" target="_blank" style="text-decoration:none;color:inherit">` : "";
          const linkEnd = gameLink ? "</a>" : "";

          const today = new Date().toDateString() === parseDate(g.date, g.longDate.split("-")[1]?.trim()).toDateString();

          return `
            <div class="ehc-game">
              <div class="ehc-date">${g.longDate}${today && todayFlag ? ' <span class="ehc-flag">●</span>' : ""}</div>
              ${linkStart}
              <div class="ehc-team">
                ${showTeamLogo ? `<img class="ehc-logo" src="https://www.sihf.ch/Image/Club/${g.team1.id}.png" />` : ""}
                ${showTeamName ? g.team1.name : ""}
              </div>
              <div class="ehc-result">${g.result}</div>
              <div class="ehc-team">
                ${showTeamName ? g.team2.name : ""}
                ${showTeamLogo ? `<img class="ehc-logo" src="https://www.sihf.ch/Image/Club/${g.team2.id}.png" />` : ""}
              </div>
              ${linkEnd}
            </div>
          `;
        })
        .join("")}
    `;
  }

  // === Einfügen ins DOM ===
  const container = document.createElement("div");
  container.innerHTML = renderGames(filtered);
  scriptTag.parentNode.insertBefore(container, scriptTag);

  console.log("✅ EHC Widget geladen:", filtered.length, "Spiele");
})();
