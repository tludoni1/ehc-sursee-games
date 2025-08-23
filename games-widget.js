(function () {
  async function renderGames() {
    try {
      const res = await fetch("https://tludoni1.github.io/ehc-sursee-games/games-all.json");
      const games = await res.json();

      console.log("Geladene Spiele:", games.length);

      let html = "<h2>EHC Sursee Spiele</h2>";
      html += "<ul style='font-family: Arial, sans-serif; line-height:1.6'>";

      games.forEach(g => {
        html += `
          <li>
            ${g.date} | ${g.team1?.name} vs. ${g.team2?.name} 
            (${g.displayInfo})
          </li>
        `;
      });

      html += "</ul>";

      document.body.innerHTML += html;  // direkt ins body für Test
    } catch (err) {
      console.error("Fehler beim Rendern:", err);
      document.body.innerHTML += "<p style='color:red'>Fehler beim Laden der Spiele!</p>";
    }
  }

  renderGames();
})();
