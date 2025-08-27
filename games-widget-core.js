(async function() {
  // Farben passend zu EHC Sursee Website
  const COLORS = {
    1: { team: "#D71920", date: "#c0c0c0", result: "#000000", line: "#CCCCCC", bg: "#FFFFFF", hover: "#F5F5F5" },
    2: { team: "#333333", date: "#D71920", result: "#000000", line: "#CCCCCC", bg: "#FFFFFF", hover: "#EEE" },
    3: { team: "#000000", date: "#333333", result: "#D71920", line: "#CCCCCC", bg: "#FFFFFF", hover: "#EEE" },
    4: { team: "#333333", date: "#333333", result: "#333333", line: "#D71920", bg: "#FFFFFF", hover: "#EEE" },
    5: { team: "#FFFFFF", date: "#FFFFFF", result: "#FFFFFF", line: "#D71920", bg: "#D71920", hover: "#A21318" }
  };

  // Liga-Mapping
  const LEAGUE_NAMES = {
    115: "U21 A",
    118: "U18 A",
    121: "U16 A",
    123: "U14 Top",
    124: "U14 A",
    10: "2. Liga",
    19: "4. Liga",
    43: "SWHL B",
    37: "Senioren D"
  };

  // Templates
  const TEMPLATES = {
    compact: `
      <li style="padding:6px; border-bottom:1px solid {{line}}; cursor:pointer;"
          onmouseover="this.style.background='{{hover}}'" onmouseout="this.style.background='{{bg}}'">
        {{linkStart}}
        <span style="color:{{date}}; font-weight:bold;">{{longDate}} {{todayFlag}}</span><br>
        {{team1Logo}} {{team1Name}} - {{team2Logo}} {{team2Name}}
        <div style="color:{{resultColor}}; font-size:14px;">{{result}}</div>
        {{league}}
        {{linkEnd}}
      </li>`,
    normal: `
      <li style="padding:10px; border-bottom:1px solid {{line}}; cursor:pointer;"
          onmouseover="this.style.background='{{hover}}'" onmouseout="this.style.background='{{bg}}'">
        {{linkStart}}
        <div style="color:{{date}}; font-weight:bold; margin-bottom:4px;">{{longDate}} {{todayFlag}}</div>
        <div>
          {{team1Logo}} {{team1Name}} vs {{team2Logo}} {{team2Name}}
        </div>
        <div style="color:{{resultColor}}; font-size:16px; margin-top:2px;">{{result}}</div>
        {{league}}
        {{linkEnd}}
      </li>`,
    large: `
      <li style="padding:14px; border-bottom:2px solid {{line}}; cursor:pointer;"
          onmouseover="this.style.background='{{hover}}'" onmouseout="this.style.background='{{bg}}'">
        {{linkStart}}
        <h4 style="color:{{date}}; margin:0 0 8px 0;">{{longDate}} {{todayFlag}}</h4>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="flex:1; text-align:left;">{{team1Logo}} {{team1Name}}</div>
          <div style="flex:0; font-size:20px; color:{{resultColor}};">{{result}}</div>
          <div style="flex:1; text-align:right;">{{team2Name}} {{team2Logo}}</div>
        </div>
        <div style="margin-top:6px; font-size:13px; color:{{date}};">{{league}}</div>
        {{linkEnd}}
      </li>`
  };

  // Hilfsfunktion: String "dd.mm.yyyy" → JS Date
  function parseDate(dateStr) {
    if (!dateStr) return null;
    const [d, m, y] = dateStr.split(".");
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }

  // Saison bestimmen (wie update-all.js)
  function getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1–12
    if (month >= 5 && month <= 12) {
      return year + 1; // Sommer-Herbst: Saison = nächstes Jahr
    } else {
      return year;     // Januar–April: Saison = aktuelles Jahr
    }
  }

  // Alle Widgets auf der Seite finden
  document.querySelectorAll("[id^='ehc-widget']").forEach(async container => {
    const seasonParam = container.dataset.season || "current";
    const season = seasonParam === "current" ? getCurrentSeason() : parseInt(seasonParam, 10);

    const teamFilter = (container.dataset.team || "all").split(",").map(s => s.trim());
    const teamName = container.dataset.teamname === "true";
    const teamLogo = container.dataset.teamlogo === "true";
    const gameLink = container.dataset.gamelink === "true";
    const todayFlag = container.dataset.todayflag === "true";
    const pastGames = container.dataset.pastgames || "all";
    const nextGames = container.dataset.nextgames || "all";
    const showLeague = container.dataset.showleague === "true";
    const size = container.dataset.size || "compact";
    const colorSet = COLORS[container.dataset.color] || COLORS[1];
    const font = container.dataset.font || "Arial, sans-serif";

    // Spiele laden
    const gamesUrl = `https://tludoni1.github.io/ehc-sursee-games/games-all-${season}.json?v=${Date.now()}`;
    let games = [];
    try {
      const res = await fetch(gamesUrl);
      games = await res.json();
    } catch (e) {
      console.error("Fehler beim Laden von", gamesUrl, e);
      container.innerHTML = `<div style="font-family:${font}; color:red;">Fehler: Keine Daten für Saison ${season} gefunden.</div>`;
      return;
    }

    // Heute als Referenz
    const today = new Date();
    today.setHours(0,0,0,0);

    // Filter nach Team
    let filtered = games.filter(g => {
      const matchesTeam = teamFilter.includes("all") || teamFilter.some(tf => g.team.includes(tf));
      return matchesTeam;
    });

    // Vergangenheit / Zukunft splitten
    const past = filtered.filter(g => parseDate(g.date) < today);
    const future = filtered.filter(g => parseDate(g.date) >= today);

    // Vergangenheit: letzte N Spiele
    let pastLimited = [];
    if (pastGames === "all") {
      pastLimited = past.sort((a,b) => parseDate(a.date) - parseDate(b.date));
    } else {
      past.sort((a,b) => parseDate(b.date) - parseDate(a.date));
      pastLimited = past.slice(0, parseInt(pastGames));
      pastLimited.sort((a,b) => parseDate(a.date) - parseDate(b.date));
    }

    // Zukunft: erste N Spiele (inkl. heute)
    let futureLimited = [];
    if (nextGames === "all") {
      futureLimited = future.sort((a,b) => parseDate(a.date) - parseDate(b.date));
    } else {
      future.sort((a,b) => parseDate(a.date) - parseDate(b.date));
      futureLimited = future.slice(0, parseInt(nextGames));
    }

    const finalGames = [...pastLimited, ...futureLimited];

    // HTML bauen
    let html = `<div style="font-family:${font}; border:1px solid ${colorSet.line}; background:${colorSet.bg};">`;
    html += `<h3 style="color:${colorSet.team}; padding:4px; margin:0; border-bottom:1px solid ${colorSet.line};">Spiele Saison ${season}</h3>`;
    html += `<ul style="list-style:none; padding:0; margin:0;">`;

    finalGames.forEach(g => {
      const gDate = parseDate(g.date);
      const isToday = gDate.getTime() === today.getTime();

      const linkStart = gameLink ? `<a href="https://www.sihf.ch/de/game-center/game/#/${g.gameId}" target="_blank" style="text-decoration:none; color:inherit;">` : "";
      const linkEnd = gameLink ? "</a>" : "";

      const team1Logo = teamLogo ? `<img src="https://www.sihf.ch/Image/Club/${g.team1.id}.png" style="height:32px; vertical-align:middle; margin-right:4px;">` : "";
      const team2Logo = teamLogo ? `<img src="https://www.sihf.ch/Image/Club/${g.team2.id}.png" style="height:32px; vertical-align:middle; margin-left:4px;">` : "";
      const team1Name = teamName ? `<span style="color:${colorSet.team};">${g.team1.name}</span>` : "";
      const team2Name = teamName ? `<span style="color:${colorSet.team};">${g.team2.name}</span>` : "";
      const todayMarker = todayFlag && isToday ? `<span style="color:${colorSet.team}">●</span>` : "";
      const leagueText = showLeague ? `<div style="font-size:12px; color:${colorSet.date}; margin-top:2px;">${LEAGUE_NAMES[g.leagueId] || "Unbekannte Liga"}</div>` : "";

      let tpl = TEMPLATES[size] || TEMPLATES.compact;
      tpl = tpl.replace("{{longDate}}", g.longDate)
               .replace("{{result}}", g.result)
               .replace("{{todayFlag}}", todayMarker)
               .replace("{{team1Logo}}", team1Logo)
               .replace("{{team2Logo}}", team2Logo)
               .replace("{{team1Name}}", team1Name)
               .replace("{{team2Name}}", team2Name)
               .replace("{{resultColor}}", colorSet.result)
               .replace(/{{date}}/g, colorSet.date)
               .replace(/{{line}}/g, colorSet.line)
               .replace(/{{hover}}/g, colorSet.hover)
               .replace(/{{bg}}/g, colorSet.bg)
               .replace("{{linkStart}}", linkStart)
               .replace("{{linkEnd}}", linkEnd)
               .replace("{{league}}", leagueText);

      html += tpl;
    });

    html += "</ul></div>";
    container.innerHTML = html;
  });
})();
