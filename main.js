// Import the ShapeCard web component
import { ShapeCard } from './shapecard.js';

// Firebase imports for storing and reading game results
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";



/*
  MemoryGame is a custom web component that implements
  a simple memory matching card game.
*/
class MemoryGame extends HTMLElement {

  constructor() {
    super();

    // Create a shadow DOM to encapsulate markup and styles
    this.attachShadow({ mode: 'open' });

    // Variables used to track the current game state
    this.firstCard = null;
    this.secondCard = null;
    this.isChecking = false;
    this.totalClicks = 0;
    this.gameOver = false;
  }



  // Called automatically when the element is added to the page
  connectedCallback() {
    this.startGame();
  }



  // ------------------- Start or restart the game -------------------
  startGame() {

    // Reset all game state variables
    this.firstCard = null;
    this.secondCard = null;
    this.isChecking = false;
    this.totalClicks = 0;
    this.gameOver = false;

    // Read the size attribute (e.g. "3x4" or "3 x 4")
    const sizeAttr = this.getAttribute('size') || '3x4';
    const cleaned = sizeAttr.toLowerCase().replace(/\s+/g, '');
    const parts = cleaned.split('x');

    const rows = parseInt(parts[0], 10) || 0;
    const cols = parseInt(parts[1], 10) || 0;
    const totalCards = rows * cols;

    // Calculate how many unique pairs are needed
    const pairCount = Math.floor(totalCards / 2);

    // Generate random cards with matching pairs
    const cardsHTML = ShapeCard.getUniqueRandomCardsAsHTML(pairCount, true);

    // Render the game UI inside the shadow DOM
    this.shadowRoot.innerHTML = `
      <style>
        .board {
          display: grid;
          grid-template-columns: repeat(${cols}, 100px);
          gap: 8px;
          margin-top: 20px;
        }

        .controls {
          text-align: center;
          margin-top: 20px;
        }

        button {
          padding: 10px 18px;
          font-size: 14px;
          font-weight: bold;
          color: white;
          background-color: #4a6cf7;
          border: none;
          border-radius: 6px;
          cursor: pointer;
        }

        button:hover {
          background-color: #3958d6;
        }
      </style>

      <h1>Memory Card Game</h1>

      <p class="instructions">
        Click two cards to flip them over.<br>
        If the shapes match, they stay face up.<br>
        Try to complete the game in as few clicks as possible!
      </p>

      <p class="click-counter">Clicks: 0</p>

      <div class="board">
        ${cardsHTML}
      </div>

      <p class="status"></p>

      <div class="controls">
        <button id="avgBtn">Show Average Clicks</button>
      </div>
    `;

    // Cache frequently used elements
    const board = this.shadowRoot.querySelector('.board');
    this.cards = Array.from(board.querySelectorAll('shape-card'));

    this.clickCounterElem = this.shadowRoot.querySelector('.click-counter');
    this.statusElem = this.shadowRoot.querySelector('.status');
    this.controlsElem = this.shadowRoot.querySelector('.controls');

    // Add event listener for the average clicks button
    const avgBtn = this.shadowRoot.querySelector('#avgBtn');
    avgBtn.addEventListener('click', () => this.showAverageClicks());

    // Add click handlers to each card
    this.cards.forEach(card => {
      card.addEventListener('click', () => this.onCardClicked(card));
    });
  }



  // ------------------- Card click handler -------------------
  onCardClicked(card) {

    // Do nothing if the game is finished
    if (this.gameOver) {
      return;
    }

    // Block clicks while checking a pair
    if (this.isChecking) {
      return;
    }

    // Ignore clicks on the same card or already face-up cards
    if (card === this.firstCard || (card.isFaceUp && card.isFaceUp())) {
      return;
    }

    // Flip the selected card
    card.flip();

    // Update click counter
    this.totalClicks++;
    this.updateClickCounter();

    // First card selection
    if (this.firstCard === null) {
      this.firstCard = card;
      return;
    }

    // Second card selection
    if (this.secondCard === null) {
      this.secondCard = card;
      this.checkForMatch();
    }
  }



  // ------------------- Check if two cards match -------------------
  checkForMatch() {
    this.isChecking = true;

    const first = this.firstCard;
    const second = this.secondCard;

    const sameType = first.getAttribute('type') === second.getAttribute('type');
    const sameColour = first.getAttribute('colour') === second.getAttribute('colour');

    if (sameType && sameColour) {
      // Matching cards stay face up
      this.resetSelection();
      this.checkForWin();
    } else {
      // Non-matching cards flip back after a short delay
      setTimeout(() => {
        first.flip();
        second.flip();
        this.resetSelection();
      }, 800);
    }
  }



  // Reset selected cards and allow new clicks
  resetSelection() {
    this.firstCard = null;
    this.secondCard = null;
    this.isChecking = false;
  }



  // Update the on-screen click counter
  updateClickCounter() {
    if (this.clickCounterElem) {
      this.clickCounterElem.textContent = 'Clicks: ' + this.totalClicks;
    }
  }



  // ------------------- Check for win condition -------------------
  checkForWin() {

    // Check if all cards are face up
    const allFaceUp = this.cards.every(card => card.isFaceUp && card.isFaceUp());

    if (allFaceUp) {
      this.gameOver = true;

      // Display win message
      if (this.statusElem) {
        this.statusElem.textContent = 'You win! Total clicks: ' + this.totalClicks;
      }

      // Save game result to Firestore
      addDoc(collection(db, "gameResults"), {
        clicks: this.totalClicks,
        completedAt: serverTimestamp()
      });

      // Create a "Play Again" button
      const playAgainBtn = document.createElement('button');
      playAgainBtn.textContent = "Play Again";
      playAgainBtn.addEventListener('click', () => this.startGame());

      this.controlsElem.appendChild(playAgainBtn);
    }
  }



  // ------------------- Show average clicks from Firestore -------------------
  async showAverageClicks() {

    // Retrieve all saved game results
    const querySnapshot = await getDocs(collection(db, "gameResults"));

    let totalClicks = 0;
    let gameCount = 0;

    querySnapshot.forEach(doc => {
      totalClicks += doc.data().clicks;
      gameCount++;
    });

    // Handle case where no games have been played
    if (gameCount === 0) {
      this.statusElem.textContent = "No games played yet.";
      return;
    }

    const average = (totalClicks / gameCount).toFixed(2);

    // Display the calculated average
    this.statusElem.textContent =
      "Average clicks to complete game: " + average;
  }
}



// Register the custom element
customElements.define('your-element', MemoryGame);
