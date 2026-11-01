// Close the language menu on an outside click or Escape.
(() => {
  const menu = document.querySelector(".lang");
  document.addEventListener("click", (e) => {
    if (!menu.contains(e.target)) menu.open = false;
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") menu.open = false;
  });
})();
