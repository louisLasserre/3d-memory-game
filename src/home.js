console.log("hello");

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
  window.location.href = `http://localhost:5173/game.html?count=${value}`;
});
