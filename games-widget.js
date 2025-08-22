(function () {
  const scriptTag = document.currentScript;
  const baseUrl = "https://tludoni1.github.io/ehc-sursee-games";

  async function init() {
    try {
      const res = await fetch(`${baseUrl}/games-all.json`);
      const allGames = await res.json();

      console.log("✅ Spiele geladen:", allGames.length);

      // Einfaches HTML: Liste mit Datum + Teams
      let html = "<div style='font-family: Arial; padding:10px;'>";
      html += "<h3>EHC Sursee Spiele</h3>";
      html += "<ul style='list-style:none; padding:0;'>";

      allGames.forEach((g) => {
        html += `
          <li style="margin:4px 0; padding:4px; border-bottom:1px solid #ccc;">
            <strong>${g.date}</strong> – 
            ${g.team1?.name || "?"} vs ${g.team2?.name || "?"} 
            <span style="color:gray;">(${g.result})</span>
          </li>
        `;
      });

      html += "</ul></div>";

      // Ausgabe ins DOM
      const container = document.createElement("div");
      container.innerHTML = html;
      scriptTag.parentNode.insertBefore(container, scriptTag);
    } catch (err) {
      console.error("❌ Fehler beim Laden des Widgets:", err);
    }
  }

  init();
})();
