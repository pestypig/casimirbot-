// Minimal interactions: enlarge chosen card, fade veil, then redirect.
const REDIRECT_TO = "/helix-core"; // <-- change if your main page is different

const cards = Array.from(document.querySelectorAll(".card"));
const veil  = document.querySelector(".veil");

function select(card){
  // Clear selection, select this one
  cards.forEach(c => c.classList.remove("selected"));
  card.classList.add("selected");

  // Gentle page veil
  requestAnimationFrame(() => {
    veil.classList.add("on");
  });

  // Short, calm delay then navigate
  const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 650;
  setTimeout(() => {
    // No persistence; purely aesthetic entry
    window.location.assign(REDIRECT_TO);
  }, delay);
}

cards.forEach(card => {
  card.addEventListener("click", () => select(card));
  // Enter key support for keyboard users
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(card);
    }
  });
});