(async function() {
  // Farben passend zu EHC Sursee Website
  const COLORS = {
    1: { team: "#D71920", date: "#c0c0c0", result: "#000000", line: "#FFFFFF", bg: "#FFFFFF", hover: "#F5F5F5" },
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

  // Templates – alles Styling hier drin
  const TEMPLATES = {
    compact: `
      <li style="padding:6px; border-bottom:1px solid {{line}}; cursor:pointer;"
          onmouseover="this.style.background='{{hover}}'" onmouseout="this.style.background='{{bg}}'">
        {{linkStart}}
        <span style="color:{{date}}; font-weight:bold; font-size:12px;">{{longDate}} {{todayFlag}}</span><br>
        <img src="{{team1Logo}}" style="height:18px; vertical-align:middle; margin-right:4px;">
        <span style="color:{{teamColor}}; font-size:12px;">{{team1Name}}</span>
         - 
        <span style="color:{{teamColor}}; font-size:12px;">{{team2Name}}</span>
        <img src="{{team2Logo}}" style="height:18px; vertical-align:middle; margin-left:4px;">
        <div style="color:{{resultColor}}; font-size:12px;">{{result}}</div>
        <div style="font-size:10px; color:{{date}};">{{league}}</div>
        {{linkEnd}}
      </li>`,
    normal: `
      <li style="padding:10px; border-bottom:1px solid {{line}}; cursor:pointer;"
          onmouseover="this.style.background='{{hover}}'" onmouseout="this.style.background='{{bg}}'">
        {{linkStart}}
        <div style="color:{{date}}; font-weight:bold; margin-bottom:4px; font-size:14px;">{{longDate}} {{todayFlag}}</div>
        <div style="display:flex; align-items:center;">
          <img src="{{team1Logo}}" style="height:26px; margin-right:6px;">
          <span style="color:{{teamColor}}; font-size:14px;">{{team1Name}}</span>
          <span style="margin:0 6px;">vs</span>
          <span style="color:{{teamColor}}; font-size:14px;">{{team2Name}}</span>
          <img src="{{team2Logo}}" style="height:26px; margin-left:6px;">
        </div>
        <div style="color:{{resultColor}}; font-size:16px; margin-top:4px;">{{result}}</div>
        <div style="font-size:12px; color:{{date}};">{{league}}</div>
        {{linkEnd}}
      </li>`,
    large: `
      <li style="padding:14px; border-bottom:2px solid {{line}}; cursor:pointer; text-align: center;"
          onmouseover="this.style.background='{{hover}}'" onmouseout="this.style.background='{{bg}}'">
        {{linkStart}}
        <h4 style="color:{{date}}; margin:0 0 8px 0; font-size:18px;">{{longDate}} {{todayFlag}}</h4>
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div style="flex:1; text-align:center;">
            <img src="{{team1Logo}}" style="height:40px; margin-right:8px;"><br>
            <span style="color:{{teamColor}}; font-size:18px;">{{team1Name}}</span>
          </div>
          <div style="flex:0; font-size:30px; color:{{resultColor}};">{{result}}</div>
          <div style="flex:1; text-align:center;">
            <img src="{{team2Logo}}" style="height:40px; margin-left:8px;"><br>
            <span style="color:{{teamColor}}; font-size:18px;">{{team2Name}}</span>
          </div>
        </div>
        <div style="margin-top:6px; font-size:13px; color:{{date}};">{{league}}</div>
        {{linkEnd}}
      </li>`
  };

  // Spiele laden
  const gamesUrl = "https://tludoni1.github.io/ehc-sursee-games/games-all.json?v=" + Date.now();
  let games = [];
  try {
    const res = await fetch(gamesUrl);
    games = await res.json();
  } catch (e) {
    console.error("Fehler beim Laden von games-all.json:", e);
    return;
  }

  // Hilfsfunktion: String "dd.mm.yyyy" → JS Date
  function parseDate(dateStr) {
    if (!dateStr) return null;
    const [d, m, y] = dateStr.split(".");
    return new Date(`${y}-${m}-${d}T00:00:00`);
  }

  // Alle Widgets auf der Seite finden
  document.querySelectorAll("[id^='ehc-widget']").forEach(container => {
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
    html += `<h3 style="color:${colorSet.team}; padding:4px; margin:0; border-bottom:1px solid ${colorSet.line};">Next Games & Resultate</h3>`;
    html += `<ul style="list-style:none; padding:0; margin:0;">`;

    finalGames.forEach(g => {
      const gDate = parseDate(g.date);
      const isToday = gDate.getTime() === today.getTime();

      const linkStart = gameLink ? `<a href="https://www.sihf.ch/de/game-center/game/#/${g.gameId}" target="_blank" style="text-decoration:none; color:inherit;">` : "";
      const linkEnd = gameLink ? "</a>" : "";

      const team1Logo = teamLogo ? `https://www.sihf.ch/Image/Club/${g.team1.id}.png` : "";
      const team2Logo = teamLogo ? `https://www.sihf.ch/Image/Club/${g.team2.id}.png` : "";
      const team1Name = teamName ? g.team1.name : "";
      const team2Name = teamName ? g.team2.name : "";
      const todayMarker = todayFlag && isToday ? `<span style="color:${colorSet.team}">●</span>` : "";
      const leagueText = showLeague ? (LEAGUE_NAMES[g.leagueId] || "Unbekannte Liga") : "";

      let tpl = TEMPLATES[size] || TEMPLATES.compact;
      tpl = tpl.replace("{{longDate}}", g.longDate)
               .replace("{{result}}", g.result)
               .replace("{{todayFlag}}", todayMarker)
               .replace("{{team1Logo}}", team1Logo)
               .replace("{{team2Logo}}", team2Logo)
               .replace("{{team1Name}}", team1Name)
               .replace("{{team2Name}}", team2Name)
               .replace("{{teamColor}}", colorSet.team)
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
