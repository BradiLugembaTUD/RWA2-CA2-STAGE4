import {ShapeCard} from './shapecard.js';
import { collection, addDoc, serverTimestamp, getDocs } from "firebase/firestore";
import { db } from "./firebase.js";








class MemoryGame extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Different steps of the game
    this.firstCard = null; // first flipped card
    this.secondCard = null; // second flipped card
    this.isChecking = false; // to block clicks while we flip back
    this.totalClicks = 0; // total number of clicks made by the player
  }


  connectedCallback() {
    this.startGame();
  }


  // ------------------- Start or restart the game -------------------
  startGame() {

    // Reset game state variables
    this.firstCard = null;
    this.secondCard = null;
    this.isChecking = false;
    this.totalClicks = 0;
    this.gameOver = false;

    // Reading size attribute "3x4" or "3 x 4"
    const sizeAttr = this.getAttribute('size') || '3x4';
    const cleaned = sizeAttr.toLowerCase().replace(/\s+/g, ''); // "3x4"
    const parts = cleaned.split('x');

    const rows = parseInt(parts[0], 10) || 0;
    const cols = parseInt(parts[1], 10) || 0;
    const totalCards = rows * cols;

    // Number of unique pairs: total cards / 2
    const pairCount = Math.floor(totalCards / 2);

    // Generating unique random cards with duplicates
    const cardsHTML = ShapeCard.getUniqueRandomCardsAsHTML(pairCount, true);
    

    this.shadowRoot.innerHTML = `
      <style>
        .board {
          display: grid;
          grid-template-columns: repeat(${cols}, 100px);
          gap: 8px;
          margin-top: 20px;
        }
      </style>

      <h1>Memory Card Game</h1>
      <p class="click-counter">Clicks: 0</p>
    
      <div class="board">
         ${cardsHTML}
      </div>

      <p class="status"></p>
      <div class="controls">
        <button id="avgBtn">Show Average Clicks</button>
      </div>

      `;

    // Adding event listeners to cards
    const board = this.shadowRoot.querySelector('.board');
    this.cards = Array.from(board.querySelectorAll('shape-card'));

    this.clickCounterElem = this.shadowRoot.querySelector('.click-counter');
    this.statusElem = this.shadowRoot.querySelector('.status');
    this.controlsElem = this.shadowRoot.querySelector('.controls');

    const avgBtn = this.shadowRoot.querySelector('#avgBtn');
    avgBtn.addEventListener('click', () => this.showAverageClicks());


    this.cards.forEach(card => {
      card.addEventListener('click', () => this.onCardClicked(card));
    });
  }



  onCardClicked(card) {

    // If game finished, do nothing
    if (this.gameOver) {
      return;
    }
    // If we're in the middle of checking, ignore clicks
    if (this.isChecking) {
      return;
    }

    // Ignore clicks on the same card or already face-up card
    if (card === this.firstCard || (card.isFaceUp && card.isFaceUp())) {
      return;
    }

    // Flip the card
    card.flip();

    this.totalClicks++;
    this.updateClickCounter();

    // First selection
    if (this.firstCard === null) {
      this.firstCard = card;
      return;
    }

    // Second selection
    if (this.secondCard === null) {
      this.secondCard = card;
      this.checkForMatch();
    }
  }

  checkForMatch() {
    this.isChecking = true;

    const first = this.firstCard;
    const second = this.secondCard;

    const sameType = first.getAttribute('type') === second.getAttribute('type');
    const sameColour = first.getAttribute('colour') === second.getAttribute('colour');

    if (sameType && sameColour) {
      // Match: leave them face up
      this.resetSelection();
      this.checkForWin();
    } else {
      // No match: flip them back after a short delay
      setTimeout(() => {
        first.flip();
        second.flip();
        this.resetSelection();
      }, 800);
    }
  }

  resetSelection() {
    this.firstCard = null;
    this.secondCard = null;
    this.isChecking = false;
  }

  updateClickCounter() {
    if (this.clickCounterElem) {
      this.clickCounterElem.textContent = 'Clicks: ' + this.totalClicks;
    }
  }



  checkForWin() {
    // All cards must be face up
    const allFaceUp = this.cards.every(card => card.isFaceUp && card.isFaceUp());

    if (allFaceUp) {
      this.gameOver = true;
      if (this.statusElem) {
        this.statusElem.textContent = 'You win! Total clicks: ' + this.totalClicks;
      }

      addDoc(collection(db, "gameResults"), 
      {
        clicks: this.totalClicks,
        completedAt: serverTimestamp()
      });

      // Create the Play Again button
      const btn = document.createElement('button');
      btn.textContent = "Play Again";
      btn.addEventListener('click', () => this.startGame());

      this.controlsElem.appendChild(btn);
    }
  }


  async showAverageClicks() {
    // Getting all the documents from Firestore
    const querySnapshot = await getDocs(collection(db, "gameResults"));

    let totalClicks = 0;
    let gameCount = 0;

    querySnapshot.forEach(doc => {
      totalClicks += doc.data().clicks;
      gameCount++;
    });

    if (gameCount === 0) {
      this.statusElem.textContent = "No games played yet.";
      return;
    }

    const average = (totalClicks / gameCount).toFixed(2);

    this.statusElem.textContent = "Average clicks to complete game: " + average;
  }



}
customElements.define('your-element', MemoryGame);



/************************ BEGINNING OF EXAMPLES *******************************/


/* example of generating several random unique cards
   with the use of static method getUniqueRandomCardsAsHTML  */

/*
document.body.innerHTML += `
    <h1>Generated unique cards</h1>
    <p>
        ${ShapeCard.getUniqueRandomCardsAsHTML(5, false)}
    </p>
`;
*/

/* example of generating several random unique cards, each with a duplicate,
   also with the use of static method getUniqueRandomCardsAsHTML */

/*
document.body.innerHTML += `
    <h1>Generated unique cards with duplicates (use this in your application)</h1>
    <p>  
        ${ShapeCard.getUniqueRandomCardsAsHTML(3, true)}
    </p>
`;
*/
/* example of flipping the cards:
   when clicked, the card is flipped and a message is sent to the console using
   the shape-card methods flip() and isFaceUp() */
/*
document.querySelectorAll('shape-card').forEach(sc => sc.addEventListener('click', e => {
    e.target.flip();
    console.log("Shape card is face up:", e.target.isFaceUp());
}));
*/
/************************ END OF EXAMPLES *******************************/  


