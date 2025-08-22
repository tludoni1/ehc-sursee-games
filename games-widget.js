(async function() {
  // Basis-URL deiner GitHub Pages
  const BASE_URL = "https://tludoni1.github.io/ehc-sursee-games";

  // === Konfiguration aus dem Script-Tag auslesen ===
  const currentScript = document.currentScript;
  const params = new URLSearchParams(currentScript.getAttribute("data-params") || "");

  const datasetTeams = (params.get("teams") || "all").split(",");
  const gamesBack = params.get("gamesBack") || "all";
  const gamesNext = params.get("gamesNext") || "all";
  const place = params.get("place") || "all";

  const size = params.get("size") || "normal";
  const showTeamName = params.get("teamName") === "true";
  const showTeamLogo = params.get("teamLogo") === "true";
  const gameLink = params.get("gameLink") === "true";
  const todayFlag = params.get("todayFlag") === "true";
  const colorScheme = params.get("color") || "1";
  const font = params.get("font") || "Arial, sans-serif";

  // === Styles (Farben von ehcsursee.ch) ===
  const COLORS = {
    1: { team: "#C8102E", date: "#000000", line: "#CCCCCC", bg: "#FFFFFF", hover: "#F5F5F5" },
    2: { team: "#000000", date: "#C8102E", line: "#CCCCCC", bg: "#FFFFFF", hover: "#EEE" },
    3: { team: "#333333", date: "#666666", line: "#999999", bg: "#F9F9F9", hover: "#EEE" },
    4: { team: "#FFFFFF", date: "#C8102E", line: "#C8102E", bg: "#000000", hover: "#222" },
    5: { team: "#C8102E", date: "#FFFFFF", line: "#C8102E", bg: "#333333", hover: "#444" },
  };

  const colors = COLORS[colorScheme] || COLORS[1];

  // === Spiele laden ===
  let games = [];
  try {
    const res = await fetch(`${BASE_URL}/games-all.json`);
    games = await res.json();
  } catch (e) {
    console.error("Fehler beim Laden von games-all.json", e);
    return;
  }

  // === Filter ===
  const now = new Date();

  games = games.filter(g => {
    const [d, m, y] = g.date.split(".");
    const gameDate = new Date(`${y}-${m}-${d}T00:00:00`);
    let ok = true;

    // Teams
    if (datasetTeams[0] !== "all") {
      ok = datasetTeams.some(t => g.team.includes(t));
    }

    // Place
    if (place !== "all") {
      ok = ok && g.place === place;
    }

    // Back
    if (gamesBack !== "all") {
      const days = (now - gameDate) / (1000 * 60 * 60 * 24);
      ok = ok && days <= parseInt(gamesBack) && days >= 0;
    }

    // Next
    if (gamesNext !== "all") {
      const days = (gameDate - now) / (1000 * 60 * 60 * 24);
      ok = ok && days <= parseInt(gamesNext) && days >= 0;
    }

    return ok;
  });

  // === Render HTML ===
  let html = `<div style="font-family:${font}; border:1px solid ${colors.line}; background:${colors.bg};">`;

  games.forEach(g => {
    const today = g.date === now.toLocaleDateString("de-DE");

    let row = `<div style="padding:8px; border-bottom:1px solid ${colors.line}; display:flex; align-items:center; justify-content:space-between; cursor:pointer;" onmouseover="this.style.background='${colors.hover}'" onmouseout="this.style.background='${colors.bg}'">`;

    // Datum & Uhrzeit
    row += `<div style="color:${colors.date}; font-size:${size === "kompakt" ? "12px" : size === "gross" ? "18px" : "14px"};">${g.longDate}</div>`;

    // Teams
    let teamsHTML = "";
    [g.team1, g.team2].forEach(team => {
      if (!team) return;
      let part = `<div style="display:flex; align-items:center; gap:4px;">`;
      if (showTeamLogo) {
        const logoUrl = `https://www.sihf.ch/Image/Club/${team.id}.png`;
        part += `<img src="${logoUrl}" alt="${team.name}" style="height:${size === "kompakt" ? "16px" : size === "gross" ? "32px" : "24px"};">`;
      }
      if (showTeamName) {
        part += `<span style="color:${colors.team};">${team.name}</span>`;
      }
      part += `</div>`;
      teamsHTML += part;
    });

    row += `<div style="flex:1; display:flex; justify-content:center; gap:10px;">${teamsHTML}</div>`;

    // Resultat oder Info
    row += `<div style="color:${colors.date}; font-weight:bold;">${g.displayInfo}</div>`;

    // Today Flag
    if (todayFlag && today) {
      row += `<div style="color:${colors.team}; font-size:20px;">●</div>`;
    }

    row += `</div>`; // row end

    // GameLink
    if (gameLink && g.gameId) {
      row = `<a href="https://www.sihf.ch/de/game-center/game/#/${g.gameId}" target="_blank" style="text-decoration:none;">${row}</a>`;
    }

    html += row;
  });

  html += "</div>";

  // === Widget einfügen ===
  const container = document.createElement("div");
  container.innerHTML = html;
  currentScript.parentNode.insertBefore(container, currentScript);
})();
