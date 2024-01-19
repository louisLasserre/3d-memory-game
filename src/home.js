const button = document.querySelector(".button");
const input = document.querySelector("input");

button.addEventListener("click", () => {
  let value = input.value;
  if (value % 2 !== 0) {
    value += 1;
  }
  if (value <= 2) {
    value = 6;
  }
  window.location.href = `https://3d-memory-game-louis.vercel.app/game/?count=${value}`;
});
