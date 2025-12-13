// Checking if two cards match
export function cardsMatch(cardA, cardB) {
  return (
    cardA.type === cardB.type &&
    cardA.colour === cardB.colour
  );
}

// Calculates average clicks from an array of numbers
export function calculateAverage(clicksArray) {
  if (clicksArray.length === 0) return 0;

  const total = clicksArray.reduce((sum, val) => sum + val, 0);
  return total / clicksArray.length;
}

