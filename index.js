// const wordsData = () => {
//   fetch('http://localhost:3001/api/v1/words')
//     .then(response => {
//       if(!response.ok) {
//         throw new Error(`status ${response.status} at URL ${response.url}`)
//       } else {
//         return response;
//       }
//     })
//     .then(response => response.json())
//     .then(data => {
//       words = data;
//       return data;
//     });
// }
// wordsData();
// setTimeout(() => {console.log(words)}, 2000)
// Global Variables
let words = [];
var winningWord = '';
var currentRow = 1;
const lastRow = 6;
var guess = '';
let guessCount = 0;
let totalGuessCount = 0;
let solved = false;
let wins = 0;
let gamesPlayed = 0;

// Query Selectors
var inputs = document.querySelectorAll('input');
var guessButton = document.querySelector('#guess-button');
var keyLetters = document.querySelectorAll('span');
var errorMessage = document.querySelector('#error-message');
var endGameMessage = document.querySelector('#end-game-message');
var viewRulesButton = document.querySelector('#rules-button');
var viewGameButton = document.querySelector('#play-button');
var viewStatsButton = document.querySelector('#stats-button');
var gameBoard = document.querySelector('#game-section');
var letterKey = document.querySelector('#key-section');
var rules = document.querySelector('#rules-section');
var stats = document.querySelector('#stats-section');
let totalGames = document.querySelector('#stats-total-games');
let percentCorrect = document.querySelector('#stats-percent-correct');
let averageGuesses = document.querySelector('#stats-average-guesses');

// Event Listeners
window.addEventListener('load', () => {
  const wordsData = () => {
    fetch('http://localhost:3001/api/v1/words')
      .then(response => {
        if(!response.ok) {
          throw new Error(`status ${response.status} at URL ${response.url}`)
        } else {
          return response;
        }
      })
      .then(response => response.json())
      .then(data => {
        words = data;
        setGame();
        return data;
      })
      .catch(err => console.log(err));
  }
  wordsData();

  const getUserStats = () => {
    fetch('http://localhost:3001/api/v1/games')
      .then(response => {
        if(!response.ok) {
          throw new Error(`status ${response.status} at URL ${response.url}`)
        } else {
          return response;
        }
      })
      .then(response => response.json())
      .then(data => {
        data.forEach((gameStat) => {
          if (gameStat.solved) {
            wins++;
          }
          totalGuessCount += gameStat.numGuesses;
        })
        return data;
      })
      .catch(err => console.log(err));
  }
  getUserStats();
});

for (var i = 0; i < inputs.length; i++) {
  inputs[i].addEventListener('keyup', function() { moveToNextInput(event) });
}

for (var i = 0; i < keyLetters.length; i++) {
  keyLetters[i].addEventListener('click', function() { clickLetter(event) });
}

guessButton.addEventListener('click', submitGuess);

viewRulesButton.addEventListener('click', viewRules);

viewGameButton.addEventListener('click', viewGame);

viewStatsButton.addEventListener('click', viewStats);

// Functions
function setGame() {
  winningWord = getRandomWord();
  currentRow = 1;
  guess = '';
  guessCount = 0;
  solved = false;
  resetBoxes();
  resetLetters();
  updateInputPermissions();
  updateStats();
}

function getRandomWord() {
  var randomIndex = Math.floor(Math.random() * words.length);
  return words[randomIndex];
}

function updateInputPermissions() {
  for(var i = 0; i < inputs.length; i++) {
    // console.log(inputs[i].id)
    if(!inputs[i].id.includes(`-${currentRow}-`)) { // if it's NOT current row, disable clicks
      inputs[i].disabled = true;
    } else {
      inputs[i].disabled = false;
    }
  }

  inputs[0].focus();
}

function moveToNextInput(e) { // 'auto' moves to next cell in same row
  // console.log(e);
  // console.log(e.keyCode)
  // console.log(e.charCode)
  var key = e.keyCode || e.charCode;

  if( key !== 8 && key !== 46 ) { // 8 is bkspace and 46 is delete
    // console.log(e.target)
    // console.log(e.target.id)
    var indexOfNext = parseInt(e.target.id.split('-')[2]) + 1; // returns an array, we need the 3rd item in the array to tell us what row we're
    // console.log(e.target.id.split('-'));
    // console.log(indexOfNext);
    if(indexOfNext !== 30) { // check if indexOfNext is LAST INDEX
      inputs[indexOfNext].focus(); 
    }
  }
}

function clickLetter(e) {
  var activeInput = null;
  var activeIndex = null;

  for (var i = 0; i < inputs.length; i++) {
    if(inputs[i].id.includes(`-${currentRow}-`) && !inputs[i].value && !activeInput) {
      activeInput = inputs[i];
      activeIndex = i;
    }
  }

  activeInput.value = e.target.innerText;
  inputs[activeIndex + 1].focus();
}

function submitGuess() {
  guessCount++;
  if (checkIsWord()) {
    errorMessage.innerText = '';
    compareGuess();
    if (checkForWin()) {
      solved = true;
      endGame(solved);
    } else if(checkForLoss()) {
      endGame();
    } else {
      changeRow();
    }
  } else {
    errorMessage.innerText = 'Not a valid word. Try again!';
  }
}

function checkIsWord() {
  guess = '';

  for(var i = 0; i < inputs.length; i++) {
    if(inputs[i].id.includes(`-${currentRow}-`)) {
      guess += inputs[i].value; // putt letters together into single word
    }
  }

  return words.includes(guess); // checks if guess is in words list
}

function compareGuess() { // invoked after guess button is clicked
  var guessLetters = guess.split(''); // ['a', 'p', 'p', 'l', 'e'] 

  for (var i = 0; i < guessLetters.length; i++) {
    if (winningWord.includes(guessLetters[i]) && winningWord.split('')[i] !== guessLetters[i]) {
      updateBoxColor(i, 'wrong-location');
      updateKeyColor(guessLetters[i], 'wrong-location-key');
    } else if (winningWord.split('')[i] === guessLetters[i]) {
      updateBoxColor(i, 'correct-location');
      updateKeyColor(guessLetters[i], 'correct-location-key');
    } else {
      updateBoxColor(i, 'wrong');
      updateKeyColor(guessLetters[i], 'wrong-key');
    }
  }
}

function updateBoxColor(letterLocation, className) {
  var row = [];
  // console.log('letter local: ', letterLocation)
  // console.log('class name: ', className)
  for (var i = 0; i < inputs.length; i++) { 
    if(inputs[i].id.includes(`-${currentRow}-`)) {
      row.push(inputs[i]);
    }
  }
  // console.log(row);
  // console.log(row[letterLocation]);
  row[letterLocation].classList.add(className) // we're adding class names to each row;
}

function resetBoxes() {
  for(var i = 0; i < inputs.length; i++) {
    inputs[i].classList = ""; // reset box colors
    inputs[i].value = ""; // reset letters in boxes
  }
}

function resetLetters() {
  // console.log(keyLetters);
  for(var i = 0; i < keyLetters.length; i++) {
    keyLetters[i].classList = ""; // reset letter colors
  }
}

function updateKeyColor(letter, className) {
  var keyLetter = null;

  for (var i = 0; i < keyLetters.length; i++) {
    if (keyLetters[i].innerText === letter) {
      keyLetter = keyLetters[i];
    }
  }

  keyLetter.classList.add(className);
}

function checkForWin() {
  return guess === winningWord;
}

function checkForLoss() {
  return currentRow === lastRow;
}

function changeRow() {
  currentRow++;
  updateInputPermissions();
}

function endGame(solved) {
  gamesPlayed++;
  if (solved) {
    endGameMessage.innerText = `After ${currentRow} guesses, you won!`;
  } else {
    endGameMessage.innerText = `You lose.`;
  }
  postStats();
  setTimeout(() => {
    endGameMessage.innerText = "";
    setGame();
  }, 4000)
}

function viewRules() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.remove('collapsed');
  stats.classList.add('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.add('active');
  viewStatsButton.classList.remove('active');
}

function viewGame() {
  letterKey.classList.remove('hidden');
  gameBoard.classList.remove('collapsed');
  rules.classList.add('collapsed');
  stats.classList.add('collapsed');
  viewGameButton.classList.add('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.remove('active');
}

function updateStats() {
  totalGames.innerText = gamesPlayed;
  percentCorrect.innerText = (wins / gamesPlayed) * 100 || 0;
  averageGuesses.innerText = Math.ceil(wins / totalGuessCount) || ' "too soon to tell" ';
}

function postStats() {
  fetch('http://localhost:3001/api/v1/games', {
   method: "POST",
   headers: {
    'Content-type': 'application/json'
   },
   body: JSON.stringify(
    { 
      "solved": solved, 
      "guesses": guessCount
    }
   )
  })
  .then(response => response.json())
  .then(data => console.log(data));
}

function viewStats() {
  letterKey.classList.add('hidden');
  gameBoard.classList.add('collapsed');
  rules.classList.add('collapsed');
  stats.classList.remove('collapsed');
  viewGameButton.classList.remove('active');
  viewRulesButton.classList.remove('active');
  viewStatsButton.classList.add('active');
}
