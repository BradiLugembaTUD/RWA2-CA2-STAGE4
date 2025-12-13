import { calculateAverage, cardsMatch } from "../gameFunctions.js";

test("calculateAverage returns correct average", () => {
  const clicks = [10, 20, 30];
  expect(calculateAverage(clicks)).toBe(20);
});

test("cardsMatch returns true only when type and colour match", () => {
  const card1 = { type: "circle", colour: "red" };
  const card2 = { type: "circle", colour: "red" };
  const card3 = { type: "square", colour: "red" };

  expect(cardsMatch(card1, card2)).toBe(true);
  expect(cardsMatch(card1, card3)).toBe(false);
});
