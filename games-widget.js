// games-widget.js
(function() {
  const coreUrl = "https://tludoni1.github.io/ehc-sursee-games/games-widget-core.js?v=" + Date.now();
  fetch(coreUrl)
    .then(r => r.text())
    .then(code => {
      try {
        eval(code);
      } catch (e) {
        console.error("Fehler beim Ausführen des Widgets:", e);
      }
    })
    .catch(err => console.error("Fehler beim Laden des Widgets:", err));
})();
