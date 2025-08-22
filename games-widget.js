console.log("✅ games-widget.js geladen");

// games-widget.js
(async () => {
  const script = document.currentScript;
  const params = script.dataset;
  const containerId = params.target;
  const container = document.getElementById(containerId);
  if (!container) return console.error(`Container #${containerId} nicht gefunden`);

  // Parameter einlesen
  const teamsParam = params.team?.split(",").map(s => s.trim()) ?? ["all"];
  const gamesBack = params.gamesback === "all" ? Infinity : parseInt(params.gamesback) || 0;
  const gamesNext = params.gamesnext === "all" ? Infinity : parseInt(params.gamesnext) || 0;
  const place = params.place ?? "all";
  const size = params.size || "normal";
  const showName = params.teamname === "true";
  const showLogo = params.teamlogo === "true";
  const linkGame = params.gamelink === "true";
  const todayFlag = params.todayflag === "true";
  const colorScheme = params.color || "Farbe1";
  const font = params.font || "Arial, sans-serif";

  // Farbvarianten (inspired by EHC colours: red & black)
  const colorMap = {
    Farbe1: { team: "#d32026", date: "#000", line: "#000", bg: "#fff", hover: "#f5f5f5" },
    Farbe2: { team: "#000", date: "#d32026", line: "#d32026", bg: "#fff", hover: "#fafafa" },
    Farbe3: { team: "#d32026", date: "#fff", line: "#000", bg: "#000", hover: "#222" },
    Farbe4: { team: "#000", date: "#fff", line: "#d32026", bg: "#fff", hover: "#eee" },
    Farbe5: { team: "#d32026", date: "#000", line: "#000", bg: "#ffeeee", hover: "#ffdddd" },
  };
  const colors = colorMap[colorScheme] || colorMap.Farbe1;

  // Hilfsfunktionen
  function parseDate(ds, ts) {
    const [d, m, y] = ds.split(".");
    return new Date(`${y}-${m}-${d}T${ts || "00:00"}`);
  }
  function isToday(dt) {
    const today = new Date(), t = new Date(dt);
    return today.toDateString() === t.toDateString();
  }

  // Fetch JSON
  let data;
  try {
    const resp = await fetch("https://raw.githubusercontent.com/tludoni1/ehc-sursee-games/main/games-all.json");
    data = await resp.json();
  } catch (e) {
    return container.innerText = "Fehler beim Laden der Spieldaten";
  }

  const now = new Date();
  const filtered = data.filter(g => {
    if (teamsParam[0] !== "all" && !teamsParam.includes(g.team.match(/^EHC Sursee\s*(.*)$/)?.[1]?.replace(/\s+/g,"").replace(".", "T"))) {
      return false;
    }
    const gameDate = parseDate(g.date, g.longDate.split(" - ")[1] ?? "00:00");
    const diffDays = (gameDate - now) / 864e5;
    if (diffDays < -gamesBack || diffDays > gamesNext) return false;
    if (place !== "all" && g.place !== place) return false;
    return true;
  });

  // Render HTML
  const html = filtered.map(g => {
    const gd = parseDate(g.date, g.longDate.split(" - ")[1] ?? "00:00");
    const showToday = todayFlag && isToday(gd);
    const logo1 = showLogo ? `<img src="https://www.sihf.ch/Image/Club/${g.team1.id}.png" alt="${g.team1.name}" style="height:1.5em;vertical-align:middle;">` : "";
    const logo2 = showLogo ? `<img src="https://www.sihf.ch/Image/Club/${g.team2.id}.png" alt="${g.team2.name}" style="height:1.5em;vertical-align:middle;">` : "";
    const tName1 = showName ? `<span>${g.team1.name}</span>` : "";
    const tName2 = showName ? `<span>${g.team2.name}</span>` : "";
    const result = g.result === "-" ? "" : `<span style="color:${colors.date};">${g.result}</span>`;
    const inner = `
      <div class="game-row" style="display:flex;align-items:center;padding:0.3em;border-bottom:1px solid ${colors.line};font-family:${font};background:${colors.bg};">
        <div style="flex:1;">${logo1} ${tName1}</div>
        <div style="flex:0 0 auto;padding: 0 0.5em;white-space:nowrap;">${g.longDate}</div>
        <div style="flex:1;text-align:right;">${tName2} ${logo2}</div>
        <div style="flex:0 0 3em;text-align:center;">${result}</div>
        ${showToday ? `<div style="padding-left:0.5em;color:${colors.team};">●</div>` : ""}
      </div>`;
    return linkGame ?
      `<a href="https://www.sihf.ch/de/game-center/game-detail/${g.gameId}/" target="_blank" style="text-decoration:none;">${inner}</a>` :
      inner;
  }).join("");

  container.innerHTML = html;
})();
