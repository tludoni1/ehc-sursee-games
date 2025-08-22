(function () {
  const scriptTag = document.currentScript;

  async function init() {
    // Testausgabe ins DOM
    const container = document.createElement("div");
    container.style.border = "2px solid red";
    container.style.padding = "10px";
    container.style.margin = "10px 0";
    container.innerHTML = "<strong>Hallo vom Widget!</strong><br>Spiele werden geladen...";

    scriptTag.parentNode.insertBefore(container, scriptTag);

    try {
      const res = await fetch("https://tludoni1.github.io/ehc-sursee-games/games-all.json");
      const allGames = await res.json();

      container.innerHTML += `<br><span>✅ Spiele geladen: ${allGames.length}</span>`;
      console.log("✅ Spiele geladen:", allGames.length, allGames);
    } catch (err) {
      container.innerHTML += "<br><span style='color:red;'>❌ Fehler beim Laden!</span>";
      console.error("❌ Fehler beim Laden:", err);
    }
  }

  init();
})();
