(async function() {
  try {
    const res = await fetch("https://tludoni1.github.io/ehc-sursee-games/games-all.json");
    const games = await res.json();

    const container = document.getElementById("ehc-widget-1");
    if (!container) {
      console.error("Kein Container #ehc-widget-1 gefunden!");
      return;
    }

    // ganz simple Ausgabe zum Test
    let html = "<h3>Spiele</h3><ul>";
    for (let g of games.slice(0, 5)) {
      html += `<li>${g.longDate}: ${g.team1.name} - ${g.team2.name} (${g.result})</li>`;
    }
    html += "</ul>";

    container.innerHTML = html;

  } catch (e) {
    console.error("Fehler beim Widget:", e);
  }
})();
