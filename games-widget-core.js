(async function() {
  // Farben passend zu EHC Sursee Website
  const COLORS = {
    1: { team: "#D71920", date: "#c0c0c0", result: "#000000", line: "#FFFFFF", bg: "#FFFFFF", hover: "#F5F5F5" },
    2: { team: "#D71920", date: "#666666", result: "#666666", line: "#c8c8c8", bg: "#FFFFFF", hover: "#EEE" },
    3: { team: "#000000", date: "#333333", result: "#D71920", line: "#CCCCCC", bg: "#FFFFFF", hover: "#EEE" },
    4: { team: "#333333", date: "#333333", result: "#333333", line: "#D71920", bg: "#FFFFFF", hover: "#EEE" },
    5: { team: "#FFFFFF", date: "#FFFFFF", result: "#FFFFFF", line: "#D71920", bg: "#D71920", hover: "#A21318" }
  };

  // Team-Mapping für Kürzel → volle Teamnamen
  const TEAM_MAP = {
    "U21": "EHC Sursee U21 A",
    "U18": "EHC Sursee U18 A",
    "U16": "EHC Sursee U16 A",
    "U14T": "EHC Sursee U14 Top",
    "U14": "EHC Sursee U14 A",
    "1T": "EHC Sursee 1. Mannschaft",
    "2T": "EHC Sursee 2. Mannschaft",
    "D": "EHC Sursee Damen",
    "S": "EHC Sursee Senioren"
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

  // Templates mit eigenen Größen
  const TEMPLATES = {
    compact: {
      html: `
        <li style="padding:6px; border-bottom:1px solid {{line}}; cursor:pointer; text-align:center;"
            onmouseover="this.style.background='{{hover}}'" onmouseout="this.style.background='{{bg}}'">
          {{linkStart}}
          <span style="color:{{date}}; font-weight:bold; font-size:{{dateFontSize}}; text-align:left;">{{longDate}} {{todayFlag}}</span><br>
          {{team1Logo}} <span style="font-size:{{teamFontSize}};">{{team1Name}}</span> -
          <span style="font-size:{{teamFontSize}}; text-align:right;">{{team2Name}} {{team2Logo}}</span>
          <div style="color:{{resultColor}}; font-size:{{resultFontSize}}; text-align:center;">{{result}}</div>
          {{league}}
          {{linkEnd}}
        </li>`,
      vars: { logoHeight: "20px", teamFontSize: "12px", resultFontSize: "20px", dateFontSize: "15px", leagueFontSize: "10px" }
    },
    normal: {
      html: `
        <li style="padding:10px; border-bottom:1px solid {{line}}; cursor:pointer;"
            onmouseover="this.style.background='{{hover}}'" onmouseout="this.style.background='{{bg}}'">
          {{linkStart}}
          <div style="color:{{date}}; font-weight:bold; margin-bottom:4px; font-size:{{dateFontSize}};">{{longDate}} {{todayFlag}}</div>
          <div>
            {{team1Logo}} <span style="font-size:{{teamFontSize}};">{{team1Name}}</span> vs
            {{team2Logo}} <span style="font-size:{{teamFontSize}};">{{team2Name}}</span>
          </div>
          <div style="color:{{resultColor}}; font-size:{{resultFontSize}}; margin-top:2px;">{{result}}</div>
          {{league}}
          {{linkEnd}}
        </li>`,
      vars: { logoHeight: "28px", teamFontSize: "14px", resultFontSize: "16px", dateFontSize: "14px", leagueFontSize: "12px" }
    },
    large: {
      html: `
        <li style="padding:14px; border-bottom:2px solid {{line}}; cursor:pointer;"
            onmouseover="this.style.background='{{hover}}'" onmouseout="this.style.background='{{bg}}'">
          {{linkStart}}
          <h4 style="color:{{date}}; margin:0 0 8px 0; font-size:{{dateFontSize}}; text-align:center;">{{longDate}} {{todayFlag}}</h4>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div style="flex:1; text-align:center;">{{team1Logo}} <br><span style="font-size:{{teamFontSize}};">{{team1Name}}</span></div>
            <div style="flex:0; font-size:{{resultFontSize}}; color:{{resultColor}};">{{result}}</div>
            <div style="flex:1; text-align:center;">{{team2Logo}} <br><span style="font-size:{{teamFontSize}};">{{team2Name}}</span></div>
          </div>
          <div style="margin-top:6px; font-size:{{leagueFontSize}}; color:{{date}};">{{league}}</div>
          {{linkEnd}}
        </li>`,
      vars: { logoHeight: "50px", teamFontSize: "20px", resultFontSize: "30px", dateFontSize: "20px", leagueFontSize: "15px" }
    }
  };

  // Hilfsfunktion: String "dd.mm.yyyy" → JS Date
  function parseDate(dateStr) {
    if (!dateStr) return null;
    const [d, m, y] = dateStr.split(".");
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }

  // Saison bestimmen
  function getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    if (month >= 5 && month <= 12) {
      return year + 1;
    } else {
      return year;
    }
  }

  // Alle Widgets
  document.querySelectorAll("[id^='ehc-widget']").forEach(async container => {
    const seasonParam = container.dataset.season || "current";
    const season = seasonParam === "current" ? getCurrentSeason() : parseInt(seasonParam, 10);

    const title = container.dataset.title || "";  // neuer Titel-Parameter
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

    const tplObj = TEMPLATES[size] || TEMPLATES.compact;

    // Spiele laden
    const gamesUrl = `https://tludoni1.github.io/ehc-sursee-games/data/games-all-${season}.json?v=${Date.now()}`;
    let games = [];
    try {
      const res = await fetch(gamesUrl);
      games = await res.json();
    } catch (e) {
      console.error("Fehler beim Laden von", gamesUrl, e);
      container.innerHTML = `<div style="font-family:${font}; color:red;">Fehler: Keine Daten für Saison ${season} gefunden.</div>`;
      return;
    }

    // Heute
    const today = new Date();
    today.setHours(0,0,0,0);

    // Filter nach Team
    let filtered = games.filter(g => {
      if (teamFilter.includes("all")) return true;
      return teamFilter.some(tf => {
        const fullName = TEAM_MAP[tf] || tf;
        return g.team === fullName;
      });
    });

    // Vergangenheit / Zukunft splitten
    const past = filtered.filter(g => parseDate(g.date) < today);
    const future = filtered.filter(g => parseDate(g.date) >= today);

    let pastLimited = [];
    if (pastGames === "all") {
      pastLimited = past.sort((a,b) => parseDate(a.date) - parseDate(b.date));
    } else {
      past.sort((a,b) => parseDate(b.date) - parseDate(a.date));
      pastLimited = past.slice(0, parseInt(pastGames));
      pastLimited.sort((a,b) => parseDate(a.date) - parseDate(b.date));
    }

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
    if (title) {
      html += `<h3 style="color:${colorSet.team}; padding:4px; margin:0; border-bottom:1px solid ${colorSet.line};">${title}</h3>`;
    } else {
      html += `<h3 style="color:${colorSet.team}; padding:4px; margin:0; border-bottom:1px solid ${colorSet.line};">Spiele Saison ${season}</h3>`;
    }
    html += `<ul style="list-style:none; padding:0; margin:0;">`;

    finalGames.forEach(g => {
      const gDate = parseDate(g.date);
      const isToday = gDate.getTime() === today.getTime();

      const linkStart = gameLink ? `<a href="https://www.sihf.ch/de/game-center/game/#/${g.gameId}" target="_blank" style="text-decoration:none; color:inherit;">` : "";
      const linkEnd = gameLink ? "</a>" : "";

      const team1Logo = teamLogo ? `<img src="https://www.sihf.ch/Image/Club/${g.team1.id}.png" style="height:${tplObj.vars.logoHeight}; vertical-align:middle; margin-right:4px;">` : "";
      const team2Logo = teamLogo ? `<img src="https://www.sihf.ch/Image/Club/${g.team2.id}.png" style="height:${tplObj.vars.logoHeight}; vertical-align:middle; margin-left:4px;">` : "";
      const team1Name = teamName ? g.team1.name : "";
      const team2Name = teamName ? g.team2.name : "";
      const todayMarker = todayFlag && isToday ? `<span style="color:${colorSet.team}">●</span>` : "";
      const leagueText = showLeague ? `<div style="font-size:${tplObj.vars.leagueFontSize}; color:${colorSet.date}; margin-top:2px;">${LEAGUE_NAMES[g.leagueId] || "Unbekannte Liga"}</div>` : "";

      let tpl = tplObj.html;
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
               .replace("{{league}}", leagueText)
               // Schriftgrößen einsetzen
               .replace(/{{teamFontSize}}/g, tplObj.vars.teamFontSize)
               .replace(/{{resultFontSize}}/g, tplObj.vars.resultFontSize)
               .replace(/{{dateFontSize}}/g, tplObj.vars.dateFontSize)
               .replace(/{{leagueFontSize}}/g, tplObj.vars.leagueFontSize);

      html += tpl;
    });

    html += "</ul></div>";
    container.innerHTML = html;
  });
})();
