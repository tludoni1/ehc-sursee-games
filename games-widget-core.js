(async function() {
  // Farben passend zu EHC Sursee Website
  const COLORS = {
    1: { team: "#D71920", date: "#333333", result: "#000000", line: "#CCCCCC", bg: "#FFFFFF", hover: "#F5F5F5" },
    2: { team: "#333333", date: "#D71920", result: "#000000", line: "#CCCCCC", bg: "#FFFFFF", hover: "#EEE" },
    3: { team: "#000000", date: "#333333", result: "#D71920", line: "#CCCCCC", bg: "#FFFFFF", hover: "#EEE" },
    4: { team: "#333333", date: "#333333", result: "#333333", line: "#D71920", bg: "#FFFFFF", hover: "#EEE" },
    5: { team: "#FFFFFF", date: "#FFFFFF", result: "#FFFFFF", line: "#D71920", bg: "#D71920", hover: "#A21318" }
  };

  const gamesUrl = "https://tludoni1.github.io/ehc-sursee-games/games-all.json?v=" + Date.now();
  let games = [];
  try {
    const res = await fetch(gamesUrl);
    games = await res.json();
  } catch (e) {
    console.error("Fehler beim Laden von games-all.json:", e);
    return;
  }

  // Helper: Date aus dd.mm.yyyy
  function parseDate(dateStr) {
    const [d, m, y] = dateStr.split(".");
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }

  function isToday(dateStr) {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    return dateStr === `${dd}.${mm}.${yyyy}`;
  }

  document.querySelectorAll("[id^='ehc-widget']").forEach(container => {
    const teamFilter = (container.dataset.team || "all").split(",").map(s => s.trim());
    const teamName = container.dataset.teamname === "true";
    const teamLogo = container.dataset.teamlogo === "true";
    const gameLink = container.dataset.gamelink === "true";
    const todayFlag = container.dataset.todayflag === "true";
    const colorSet = COLORS[container.dataset.color] || COLORS[1];
    const font = container.dataset.font || "Arial, sans-serif";

    const pastGamesRaw = container.dataset.pastgames || "0";
    const nextGamesRaw = container.dataset.nextgames || "0";
    const sortGame = (container.dataset.sortgame || "asc").toLowerCase();

    const pastGames = pastGamesRaw.toLowerCase() === "all" ? "all" : parseInt(pastGamesRaw, 10) || 0;
    const nextGames = nextGamesRaw.toLowerCase() === "all" ? "all" : parseInt(nextGamesRaw, 10) || 0;

    const today = new Date();

    // Team-Filter
    let filtered = games.filter(g => {
      const matchesTeam = teamFilter.includes("all") || teamFilter.some(tf => g.team.includes(tf));
      return matchesTeam;
    });

    // In Vergangenheit / Zukunft splitten
    const past = filtered.filter(g => parseDate(g.date) < today);
    const future = filtered.filter(g => parseDate(g.date) >= today);

    // Limit anwenden
    let limited = [];
    if (pastGames === "all") {
      limited.push(...past);
    } else if (pastGames > 0) {
      limited.push(...past.slice(-pastGames));
    }

    if (nextGames === "all") {
      limited.push(...future);
    } else if (nextGames > 0) {
      limited.push(...future.slice(0, nextGames));
    }

    // Wenn beide 0 → alles
    if (pastGames === 0 && nextGames === 0) {
      limited = filtered;
    }

    // Endgültig sortieren
    limited.sort((a, b) => {
      const da = parseDate(a.date);
      const db = parseDate(b.date);
      return sortGame === "desc" ? db - da : da - db;
    });

    // HTML bauen
    let html = `<div style="font-family:${font}; border:1px solid ${colorSet.line}; background:${colorSet.bg};">`;
    html += `<h3 style="color:${colorSet.team}; padding:4px; margin:0; border-bottom:1px solid ${colorSet.line};">Spiele</h3>`;
    html += `<ul style="list-style:none; padding:0; margin:0;">`;

    limited.forEach(g => {
      const isTodayGame = isToday(g.date);
      const linkStart = gameLink ? `<a href="https://www.sihf.ch/de/game-center/game/#/${g.gameId}" target="_blank" style="text-decoration:none; color:inherit;">` : "";
      const linkEnd = gameLink ? "</a>" : "";

      html += `<li style="padding:6px; border-bottom:1px solid ${colorSet.line}; cursor:pointer;" onmouseover="this.style.background='${colorSet.hover}'" onmouseout="this.style.background='${colorSet.bg}'">`;
      html += linkStart;

      html += `<span style="color:${colorSet.date}; font-weight:bold;">${g.longDate}</span>`;
      if (todayFlag && isTodayGame) html += ` <span style="color:${colorSet.team}">●</span>`;
      html += "<br>";

      if (teamLogo) html += `<img src="https://www.sihf.ch/Image/Club/${g.team1.id}.png" style="height:20px; vertical-align:middle; margin-right:4px;">`;
      if (teamName) html += `<span style="color:${colorSet.team};">${g.team1.name}</span>`;
      html += " - ";
      if (teamLogo) html += `<img src="https://www.sihf.ch/Image/Club/${g.team2.id}.png" style="height:20px; vertical-align:middle; margin-right:4px;">`;
      if (teamName) html += `<span style="color:${colorSet.team};">${g.team2.name}</span>`;

      html += `<div style="color:${colorSet.result}; font-size:14px;">${g.result}</div>`;

      html += linkEnd;
      html += "</li>";
    });

    html += "</ul></div>";
    container.innerHTML = html;
  });
})();
