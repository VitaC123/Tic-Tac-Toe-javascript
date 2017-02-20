(function () {
  "use strict";

  var player1 = {
    player: undefined,
    marker: "x",
    moves: [],
    score: 0
  };

  var player2 = {
    player: undefined,
    marker: "o",
    moves: [],
    score: 0
  };

  var gameboard = {
    activeGame: false,
    currentPlayer: player2, // Prompts Player 1 for game's first move
    numberOfGames: 1,
    availablePositions: [0, 1, 2, 3, 4, 5, 6, 7, 8],
    winningCombos: [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ],
    adjustGameboardSize: function () {
      this.determineScaledHeightForGameSquare().then(function (result) {
        return gameboard.applyScaledHeightToGameSquare(result);
      }).then(function (result) {
        gameboard.scaleCanvasWidthToMatchHeight(result);
      });
    },
    determineScaledHeightForGameSquare: function () {
      return new Promise(function (resolve, reject) {
        var scaledHeight = Math.floor($(window).width() * 0.25);
        if (scaledHeight > $(window).height()) {
          scaledHeight = Math.floor($(window).height() * 0.1);
        }
        if (scaledHeight > 240) {
          scaledHeight = 240;
        }
        if (scaledHeight) {
          resolve(scaledHeight);
        } else {
          reject("Unable to determine scaledHeight");
        }
      });
    },
    applyScaledHeightToGameSquare: function (scaledHeight) {
      return new Promise(function (resolve, reject) {
        $(".gameSquare").height(scaledHeight);
        resolve(scaledHeight);
      });
    },
    scaleCanvasWidthToMatchHeight: function (scaledHeight) {
      return new Promise(function (resolve, reject) {
        $("canvas").width(scaledHeight);
        resolve("Resized");
      });
    }
  };

  $(document).ready(function () {
    gameboard.adjustGameboardSize();
    $("table").css("top", "-" + $(".dialogueBox").height() + "px");
  });

  $(window).resize(function () {
    gameboard.adjustGameboardSize();
  });

  $(".radio").click(function () {
    if ($("#player1Human").prop("checked")) {
      player1.player = "human";
    }
    if ($("#player1Computer").prop("checked")) {
      player1.player = "computer";
    }
    if ($("#player2Human").prop("checked")) {
      player2.player = "human";
    }
    if ($("#player2Computer").prop("checked")) {
      player2.player = "computer";
    }
    if (player1.player && player2.player) {
      $(".startGame").removeClass("disabled");
    }
  });

  $(".startGame").click(function () {
    if (!$(this).hasClass("disabled")) {
      clearGameboardForNewGame();
      gameboard.activeGame = true;
      $(".introUtility").slideUp("slow", function () {
        displayScore();
        $(".scoreboard").fadeIn("fast", function () {
          $(".gameSquare").css("border-color", "grey");
          $("canvas").css("visibility", "visible");
          cycleActivePlayer();
        });
      });
      $(".dialogueBox").removeClass("startScreen").addClass("scoreboardScreen");
      $(".startGame").addClass("disabled");
    }
  });

  $(".playAgain").click(function () {
    if (!$(this).hasClass("disabled")) {
      $(this).addClass("disabled").addClass("btn-info").removeClass("btn-success");
      clearGameboardForNewGame();
      gameboard.numberOfGames++;
      gameboard.activeGame = true;
      $(".gameSquare").css("border-color", "grey");
      $("canvas").css("visibility", "visible");
      cycleActivePlayer();
      displayScore();
    }
  });

  $(".resetGame").click(function () {
    player1.player = null;
    player2.player = null;
    player1.score = 0;
    player2.score = 0;
    gameboard.numberOfGames = 0;
    $(".scoreboard").fadeOut("fast", function () {
      $(".dialogueBox").removeClass("scoreboardScreen").addClass("startScreen");
      $(".introUtility").slideDown("slow", function () {
        $(".playAgain").addClass("disabled");
        clearGameboardForNewGame();
      });
    });
  });

  function clearGameboardForNewGame() {
    player1.moves = [];
    player2.moves = [];
    gameboard.activeGame = false;
    gameboard.availablePositions = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    gameboard.currentPlayer = player2;
    clearAllCanvasElements();
    $("input").prop("checked", false);
    $(".gameSquare").css("border-color", "white");
  }

  function displayScore() {
    $(".score").html(
      "Game no. " + gameboard.numberOfGames + "<br>" +
      player1.marker.toUpperCase() + "'s " + player1.score + ", " +
      player2.marker.toUpperCase() + "'s " + player2.score
    );
  }

  $("td").click(function enableHumanMove() {
    if (gameboard.currentPlayer.player === "human" && gameboard.activeGame) {
      var locationOfMove = $(this).index("td");
      if (gameboard.availablePositions[locationOfMove] !== null) {
        gameboard.availablePositions[locationOfMove] = null;
        gameboard.currentPlayer.moves.push(locationOfMove);
        drawMarker(locationOfMove);
        scanForWinningCombo();
      }
    }
  });

  function makeComputerMove() {
    if (gameboard.activeGame) {
      var locationOfMove;
      if (player1.moves.length === 0) {
        locationOfMove = Math.floor(Math.random() * 9);
      } else {
        locationOfMove = determineOffensiveMove(gameboard.currentPlayer);
      }
      if (locationOfMove === undefined) {
        locationOfMove = determineDefensiveMove(gameboard.currentPlayer);
      }
      if (locationOfMove === undefined) {
        locationOfMove = selectTheFirstEmptySquare();
      }
      gameboard.availablePositions[locationOfMove] = null;
      gameboard.currentPlayer.moves.push(locationOfMove);
      drawMarker(locationOfMove);
      scanForWinningCombo();
    }

    function determineOffensiveMove(currentPlayer) {
      var otherPlayer = currentPlayer === player1 ? player2 : player1;
      for (var i = 0; i < gameboard.winningCombos.length; i++) {
        var combo = gameboard.winningCombos[i];
        var invalidatedByOtherPlayerMoves = otherPlayer.moves.some(function (val) {
          return combo.indexOf(val) !== -1;
        });
        if (invalidatedByOtherPlayerMoves) {
          continue;
        }
        var missingValuesFromWinningCombo = combo.filter(function (val) {
          return currentPlayer.moves.indexOf(val) === -1;
        });
        if (missingValuesFromWinningCombo.length === 1) {
          return missingValuesFromWinningCombo[0];
        }
      }
    }
  }

  function determineDefensiveMove(currentPlayer) {
    var otherPlayer = currentPlayer === player1 ? player2 : player1;
    var secondBestMove;
    for (var i = 0; i < gameboard.winningCombos.length; i++) {
      var combo = gameboard.winningCombos[i];
      var defensiveMoves = combo.filter(function (val) {
        return otherPlayer.moves.indexOf(val) === -1;
      });
      if (defensiveMoves.length === 1 && gameboard.availablePositions[defensiveMoves[0]] !== null) {
        return defensiveMoves[0];
      }
      if (defensiveMoves.length === 2) {
        secondBestMove = defensiveMoves.find(function (val) {
          return gameboard.availablePositions.indexOf(val) !== -1;
        });
      }
    }
    return secondBestMove;
  }

  function selectTheFirstEmptySquare() {
    for (var i = 0; i < gameboard.availablePositions.length; i++) {
      if (gameboard.availablePositions[i] !== null) {
        return gameboard.availablePositions[i];
      }
    }
  }

  function scanForWinningCombo() {
    var aWinningCombination;
    for (var i = 0; i < gameboard.winningCombos.length; i++) {
      var combo = gameboard.winningCombos[i];
      aWinningCombination = combo.every(function (val) {
        return gameboard.currentPlayer.moves.indexOf(val) !== -1;
      });
      if (aWinningCombination) {
        gameboard.activeGame = false;
        gameboard.currentPlayer.score++;
        $(".messageToPlayer").html(gameboard.currentPlayer.marker.toUpperCase() + "'s win!");
        displayScore();
        $(".gameSquare").css("border-color", "white");
        $(".playAgain").removeClass("disabled").removeClass("btn-info").addClass("btn-success");
        break;
      }
    }
    if (player1.moves.length + player2.moves.length === 9) {
      gameboard.activeGame = false;
      $(".messageToPlayer").html("It's a tie!");
      displayScore();
      $(".gameSquare").css("border-color", "white");
      $(".playAgain").removeClass("disabled").removeClass("btn-info").addClass("btn-success");
    } else if (!aWinningCombination) {
      cycleActivePlayer();
    }
  }

  function cycleActivePlayer() {
    if (gameboard.currentPlayer === player1) {
      gameboard.currentPlayer = player2;
    } else {
      gameboard.currentPlayer = player1;
    }
    if (gameboard.currentPlayer.player === "computer") {
      setTimeout(makeComputerMove, 1100);
    }
    $(".actionWord").removeClass("go");
    $(".messageToPlayer").html(gameboard.currentPlayer.marker.toUpperCase() +
      "'s, <span class='actionWord'>go!</span>");
    setTimeout(function () {
      $(".actionWord").addClass("go");
    }, 400);
  }


  function drawMarker(locationOfMove) {
    if (gameboard.activeGame) {
      var canvas = document.getElementsByTagName("canvas")[locationOfMove];
      var context = canvas.getContext("2d");
      canvas.width = canvas.height; // Ensure canvas is a square
      context.lineWidth = $("body").css("font-size").slice(0, -2);
      if (gameboard.currentPlayer.marker === "x") {
        drawX(canvas, context);
      } else {
        drawO(canvas, context);
      }
    }
  }

  function drawX(canvas, context) {
    context.strokeStyle = "#f0ad4e";
    var position1 = canvas.width * 0.25;
    var position2 = canvas.width * 0.75;
    var drawSpeed = 3;

    for (var incrementToPos2 = position1; incrementToPos2 < position2; incrementToPos2++) {
      setTimeout(function () {
        context.beginPath();
        context.moveTo(position1, position1);
        context.lineTo(incrementToPos2, incrementToPos2);
        context.stroke();
      }, incrementToPos2 * drawSpeed);
    }

    var position3 = position2;
    var position4 = position1;

    for (incrementToPos2 = position1; incrementToPos2 < position2; incrementToPos2++) {
      setTimeout(function () {
        context.beginPath();
        context.moveTo(position1, position2);
        context.lineTo(position4, position3);
        context.stroke();
        position3--;
        position4++;
      }, incrementToPos2 * drawSpeed);
    }
  }

  function drawO(canvas, context) {
    context.strokeStyle = "#337ab7";
    var centerX = canvas.width * 0.5;
    var centerY = canvas.height * 0.5;
    var radius = canvas.width * 0.25;
    var startAngle = 6.25;

    for (var i = 6.25; i > 0; i = i - 0.05) {
      setTimeout(function () {
        context.beginPath();
        context.arc(centerX, centerY, radius, startAngle, (2 * Math.PI));
        context.stroke();
        startAngle = startAngle - 0.1;
      }, i * 150);
    }
  }

  function clearAllCanvasElements() {
    for (var i = 0; i < gameboard.availablePositions.length; i++) {
      var canvas = document.getElementsByTagName("canvas")[i];
      var context = canvas.getContext("2d");
      context.clearRect(0, 0, canvas.width, canvas.height);
    }
    $("canvas").css("visibility", "hidden");
  }
})();
