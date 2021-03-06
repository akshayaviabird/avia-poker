
$(document).ready(function () {
  $('#gameDiv').hide();
  $('.modal-trigger').leanModal();
  $('.tooltipped').tooltip({ delay: 50 });

});


var socket = io();
var gameInfo = null;
let codeValue
let time;
let user;
let bgmusic;
let email;
let userName;
bgmusic = document.getElementById("bgmusic");

var url_string = location.href
var url = new URL(url_string);
codeValue = url.searchParams.get("token");
userName= url.searchParams.get("username");
email= url.searchParams.get("email");

// document.getElementById('playsound').innerHTML = "playsound"
// document.getElementById('stopsound').innerHTML = "stopsound"
let downloadTimer;

// let globaltimmer;
// let timmer; 
// var   startButton = document.getElementById("startButton");
// var   pauseButton = document.getElementById("pauseButton");
// startButton.addEventListener('click', timerstart);
// pauseButton.addEventListener('click', timerpause);

if (codeValue !== null) {
  console.log('code:', codeValue)
  document.getElementById("hostButton").style.display = "none";
  document.getElementById("joinButton").style.display = "inherit";
}

// if(codeValue == null){ 
//      startButton.innerHTML="Start timer"
//      pauseButton.innerHTML="Pasue Timer"
// }else{
//   startButton.style.display="none"
//   pauseButton.style.display="none"
// }

// function timerstart(){
// // downloadTimer;
// console.log('timmer',time)
// downloadTimer= setInterval(function()
// {
//   if(time <= 0){ 
//   clearInterval(downloadTimer); 
//       //  document.getElementById("countdown").innerHTML = "Finished";
//        socket.emit('moveMade', { move: 'fold', bet: 'Fold', code: codeValue });
//  } else { 
//       document.getElementById("countdown").innerHTML = time + " seconds remaining"; 
//  }  
//   time -= 1; 
//   }, 1000); 
// }
// function timerpause(){ 
//   console.log('sdfgn',time);
//  clearInterval(downloadTimer)
// }

function stopbgusic() {
  bgmusic.pause();
}
function playbgmusic() {
  bgmusic.play();
}
function updateblinds() {
  const data = {
    "smallBlind": 20,
    "bigBlind": 40
  }
  socket.emit('updateblinds', data)
}

socket.on('sendcardsdata', (data) => {
  // console.log("New round started");
  // console.log(data);
  $('#abcd').html(data.hand)
})

socket.on('playerDisconnected', function (data) {
  Materialize.toast(data.player + ' disconnected.', 4000);
});

socket.on('hostRoom', function (data) {
  codeValue = data.code;
  if (data != undefined) {
    if (data.players.length > 8) {
      $('#hostModalContent').html(
        '<h5>Code:</h5><code>' +
        data.code +
        '</code><br /><h5>Warning: you have too many players in your room. Max is 8.</h5><h5>Players Currently in My Room</h5>'
      );
      $('#playersNames').html(
        data.players.map(function (p, index) {
          return '<span>' + (parseInt(index) + 1) + '.' + "&nbsp" + p + '</span><br />';
        })
      );
    } else if (data.players.length > 1) {
      $('#hostModalContent').html(
        '<h5>Code:</h5><code>' +
        window.location.href + 'playgame?token=' + data.code +
        '</code><br /><h5>Players Currently in My Room</h5>'
      );
      $('#playersNames').html(
        data.players.map(function (p, index) {
          return '<span>' + (parseInt(index) + 1) + '.' + "&nbsp" + p + '</span><br />';
        })
      );
      $('#startGameArea').html(
        '<br /><button onclick=startGame(' +
        data.code +
        ') type="submit" class= "waves-effect waves-light green darken-3 white-text btn-flat">Start Game</button >'
      );
    } else {
      $('#hostModalContent').html(
        '<h5>Code:</h5><code>' +
        window.location.href + 'playgame?token=' + data.code +
        '</code><br /><h5>Players Currently in My Room</h5>'
      );
      $('#playersNames').html(
        data.players.map(function (p, index) {
          return '<span>' + (parseInt(index) + 1) + '.' + "&nbsp" + p + '</span><br />';
        })
      );
    }
  } else {
    Materialize.toast(
      'Enter a valid name! (max length of name is 12 characters)',
      4000
    );
    $('#joinButton').removeClass('disabled');
  }
});

socket.on('hostRoomUpdate', function (data) {
  $('#playersNames').html(
    data.players.map(function (p, index) {
      return '<span>' + (parseInt(index) + 1) + '.' + "&nbsp" + p + '</span><br />';
    })
  );
  if (data.players.length == 1) {
    $('#startGameArea').empty();
  }
});

socket.on('joinRoomUpdate', function (data) {
  $('#startGameAreaDisconnectSituation').html(
    '<br /><button onclick=startGame(' +
    data.code +
    ') type="submit" class= "waves-effect waves-light green darken-3 white-text btn-flat">Start Game</button >'
  );
  $('#joinModalContent').html(
    '<h5>' +
    data.host +
    "'s room</h5><hr /><h5>Players Currently in Room</h5><p>You are now a host of this game.</p>"
  );

  $('#playersNamesJoined').html(
    data.players.map(function (p, index) {
      return '<span>' + (parseInt(index) + 1) + '.' + "&nbsp" + p + '</span><br />';
    })
  );
});

socket.on('getresult', function (data) {
  stopGame(data)
})

socket.on('joinRoom', function (data) {
  if (data == undefined) {
    $('#joinModal').closeModal();
    Materialize.toast(
      "Unable to Join",
      4000
    );
    $('#hostButton').removeClass('disabled');
  } else if (data == "no") {
    $('#joinModal').closeModal();
    Materialize.toast(
      "You can't join, when game is in progress!",
      4000
    );
  }
  else {
    $('#joinModalContent').html(
      '<h5>' +
      data.host +
      "'s room</h5><hr /><h5>Players Currently in Room</h5><p>Please wait until your host starts the game. Leaving the page, refreshing, or going back will disconnect you from the game. </p>"
    );
    $('#playersNamesJoined').html(
      data.players.map(function (p, index) {
        return '<span>' + (parseInt(index) + 1) + '.' + "&nbsp" + p + '</span><br />';
      })
    );
  }
});

socket.on('dealt', function (data) {
  $('#mycards').html(
    data.cards.map(function (c) {
      return renderCard(c);
    })
  );
  $('#usernamesCards').text('My Cards');
  $('#mainContent').remove();
});

socket.on('rerender', function (data) {
  socket.emit('timer_turn', data.players);
  console.log(data.players);
  if (data.myBet == 0) {
    $('#usernamesCards').text('My Cards');
  } else {
    $('#usernamesCards').text('My Bet: $' + data.myBet);
  }
  if (data.community != undefined) {
    // document.getElementById("communityCards").style.marginTop = "-140px";
    $('#communityCards').html(
      data.community.map(function (c) {
        return renderCard(c);
      })
    );
  }
  else $('#communityCards').html('<p></p>');
  if (data.currBet == undefined) data.currBet = 0;
  $('#table-title').text(
    'Game ' +
    data.round +
    // '    |    ' +
    // data.stage +
    // '    |    Current Top Bet: $' +
    // data.topBet +
    '    |    Pot: $' +
    data.pot
  );
  $('#opponentCards').html(
    data.players.map(function (p) {
      return renderOpponent(p.username, p.winningStreak, {
        text: p.status,
        money: p.money,
        blind: p.blind,
        bets: data.bets,
        buyIns: p.buyIns,
        isChecked: p.isChecked,
        winningStreak: p.winningStreak,
      });
    })
  );
  renderSelf({
    money: data.myMoney,
    text: data.myStatus,
    blind: data.myBlind,
    bets: data.bets,
    buyIns: data.buyIns,
  });

  $('#scoreboard').html(
    data.players.map(function (p) {
      return renderOpponentScore(p.username, {
        text: p.status,
        money: p.money,
        // blind: p.blind,
        // bets: data.bets,
        buyIns: p.buyIns,
        isChecked: p.isChecked,
      });
    })
  );
  renderSelfScoreboard({
    money: data.myMoney,
    // text: data.myStatus,
    // blind: data.myBlind,
    // bets: data.bets,
    buyIns: data.buyIns,
  });

  if (!data.roundInProgress) {
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    $('#countdown').hide();
  }
});

socket.on('gameBegin', function (data) {
  $('#navbar-ptwu').hide();
  $('#joinModal').closeModal();
  $('#hostModal').closeModal();
  if (data == undefined) {
    alert('Error - invalid game.');
  } else {
    $('#gameDiv').show();

    playbgmusic();
  }
});

socket.on('ring', function (data) {
  console.log(data);
  if (data == 'fold') {
    var x = document.getElementById("fold");
    x.play();
  } else if (data == 'check') {
    var x = document.getElementById("check");
    x.play();
  } else if (data == 'bet') {
    var x = document.getElementById("raise");
    x.play();
  } else if (data == 'call') {
    var x = document.getElementById("call");
    x.play();
  } else if (data == 'raise') {
    var x = document.getElementById("raise");
    x.play();
  }
})
function playNext() {
  socket.emit('startNextRound', {});
}
if (codeValue === null) {
  $('#stopGame').html(
    // '<a href="#hostModal"> Stop Game</button></a>'
    ' <button onClick=result() class="callBtns menuButtons">Stop Game</button>'
  )
}
socket.on('reveal', function (data) {
  $('#usernameFold').hide();
  $('#usernameCheck').hide();
  $('#usernameBet').hide();
  $('#usernameCall').hide();
  $('#usernameRaise').hide();
  $('#countdown').hide()

  console.log(`Winning streak of every user ${data.winningStreak}`)
  // $('#abcd').html(`Your Winning Streak is ${data.winningStreak}`)
  for (var i = 0; i < data.winners.length; i++) {
    if (data.winners[i] == data.username) {
      Materialize.toast('You won the hand!', 4000);
      break;
    }
  }
  $('#table-title').text('Hand Winner(s): ' + data.winners);

  console.log(data.host + data.username);
  if (data.host === data.username) {
    $('#playNext').html(
      '<button onClick=playNext() id="playNextButton" class="callBtns menuButtons">Start Next Game</button>'
    );
    // $('#stopGame').html(
    //   // '<a href="#hostModal"> Stop Game</button></a>'
    //   ' <button onClick=stopGame() class="btn white black-text menuButtons">Stop Game</button>'
    // )
  }
  // if (codeValue !== null) {

  //   $('#showscore').html(
  //     '<button onClick=result()  class="btn white black-text menuButtons">Show score</button></a>'
  //   )
  // }
  $('#blindStatus').text(data.hand);
  $('#usernamesMoney').text('$' + data.money);
  $('#opponentCards').html(
    data.cards.map(function (p) {
      return renderOpponentCards(p.username, {
        cards: p.cards,
        folded: p.folded,
        money: p.money,
        endHand: p.hand,
        buyIns: p.buyIns,
        winningStreak: p.winningStreak,
      });
    })
  );
  $('#scoreboard').html(
    data.cards.map(function (p) {
      return renderOpponentScoreCards(p.username, {
        // cards: p.cards,
        folded: p.folded,
        money: p.money,
        // endHand: p.hand,
        buyIns: p.buyIns,
      });
    })
  );
});

function stopGame(data) {
  $('#gameDiv').hide();
  let dia = document.getElementById("myDialogother")
  dia.showModal();
  // points.sort(function(a, b){return b - a});
  var listItems = data.sort((a, b) => ((a.money - a.buyIns * 1000) > (b.money - b.buyIns * 1000) ? -1 : ((b.money - b.buyIns * 1000) > (a.money - a.buyIns * 1000)) ? 1 : 0)).map(function (item, index) {
    let medals
    if (index == 0) {
      medals = '<i class="em em-first_place_medal" aria-role="presentation" aria-label="BIRD"></i>'
    }
    else if (index == 1) {
      medals = '<i class="em em-second_place_medal" aria-role="presentation" aria-label="BIRD"></i>'
    }
    else if (index == 2) {
      medals = '<i class="em em-third_place_medal" aria-role="presentation" aria-label="BIRD"></i>'
    }
    else {
      medals = '<i class="em em-candy" aria-role="presentation" aria-label="BIRD"></i>'
    }
    return '<div style ="font-size:1.5em">' + medals + "&nbsp" + item.username + "&nbsp" + "=>" + "&nbsp" + (item.money - item.buyIns * 1000) + "." + '</div>'
  })

  dia.innerHTML = '<div class="result_img_div"><img class="result-image" src="/css/ABRD.png"/></div>' + '<div class="Result-Title"><u>Aviabird Poker Results</u></div>' + listItems

  var btn = document.createElement('button');
  btn.textContent = 'Close';
  btn.style.marginTop = '20px'
  btn.style.backgroundColor = 'black'
  btn.style.color = 'white'
  btn.style.height = '40px'
  btn.style.borderRadius = '10px'
  btn.style.width = '100%'
  btn.addEventListener("click", function () {
    if (codeValue === null) {
      location.reload()
    }
    if (codeValue !== null) {
      dia.close()
      location.reload()
    }
  });
  dia.appendChild(btn);
  console.log(data);
  //  var ii= document.getElementById("gameover").showModal(); 
  //   $("#gameover").modal('show')
  //   console.log('sedrfg')
  // socket.emit('disconnect', {});
  // $('#gameOverModalContent').html(
  //   '<h5>Code:</h5><code>' +

  //   '</code><br /><h5>Warning: you have too many players in your room. Max is 11.</h5><h5>Players Currently in My Room</h5>'
  // );
  // location.reload()
  // if(codeValue !== undefined){
  //   location.reload()
  // $('#gameover').closeModal();
  // }

  // console.log('clicked')
  // $('#DashboardAream').html(
  //   '<br /><button type="submit" class= "waves-effect waves-light green darken-3 white-text btn-flat">"sssssssssssssssssssssssssssssssssssssss"</button >'
  // );
}
socket.on('endHand', function (data) {
  $('#usernameFold').hide();
  $('#usernameCheck').hide();
  $('#usernameBet').hide();
  $('#usernameCall').hide();
  $('#usernameRaise').hide();
  $('#countdown').hide()
  $('#table-title').text('Round-Winner : ' + data.winner);

  if (data.host == data.username) {
    $('#playNext').html(
      '<button onClick=playNext() id="playNextButton" class="callBtns menuButtons">Start Next Game</button>'
    );
    // $('#stopGame').html(
    //   // '<button onClick=stopGame() id="playNextButton" class="btn white black-text menuButtons">Stop Game</button>'
    //        '<button onClick=stopGame()  class="btn white black-text menuButtons">Stop Game</button></a>'

    // )
  }
  // if (codeValue !== null) {
  //   $('#showscore').html(
  //     '<button onClick=result()()  class="btn white black-text menuButtons">Show score</button></a>'
  //   )
  // }
  $('#blindStatus').text('');
  if (data.folded == 'Fold') {
    $('#status').text('You Folded');
    $('#playerInformationCard').removeClass('theirTurn');
    $('#playerInformationCard').removeClass('green');
    $('#playerInformationCard').addClass('grey');
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    $('#countdown').hide()

  }
  $('#usernamesMoney').text('$' + data.money);
  $('#opponentCards').html(
    data.cards.map(function (p) {
      return renderOpponent(p.username, p.winningStreak, {
        text: p.text,
        money: p.money,
        blind: '',
        bets: data.bets,
      });
    })
  );

  $('#scoreboard').html(
    data.cards.map(function (p) {
      return renderOpponentScore(p.username, {
        text: p.text,
        money: p.money,
        // blind: '',
        // bets: data.bets,
      });
    })
  );
});


var beginHost = function () {
  if (userName == '') {
    $('.toast').hide();
    $('#hostModal').closeModal();
    Materialize.toast(
      'Enter a valid name! (max length of name is 12 characters)',
      4000
    );
    $('#joinButton').removeClass('disabled');
  } else if (userName == '' || email.includes('@') == false) {
    $('.toast').hide();
    $('#hostModal').closeModal();
    Materialize.toast(
      'Please enter a valid email',
      4000
    );
    $('#joinButton').removeClass('disabled');
  } else {
    user = userName
    socket.emit('host', { username: userName, email: email });
    $('#joinButton').addClass('disabled');
    $('#joinButton').off('click');
  }
};
var url_string = window.location.href;
var url = new URL(url_string);
// var codeValue = url.searchParams.get("token");

var joinRoom = function () {

  // yes, i know this is client-side.
  if (
    userName == '' ||
    email == '' ||
    userName.length > 12
  ) {
    $('.toast').hide();
    Materialize.toast(
      'Enter a your name/Email (max length of name is 12 characters.)',
      4000
    );
    $('#joinModal').closeModal();
    $('#hostButton').removeClass('disabled');
    $('#hostButton').on('click');
  } else if (email == '' && email.includes('@') == false) {
    $('.toast').hide();
    Materialize.toast(
      'Enter a your valid Email! ',
      4000
    );
    $('#joinModal').closeModal();
    $('#hostButton').removeClass('disabled');
    $('#hostButton').on('click');
  } else {
    user = userName;
    socket.emit('join', {
      code: codeValue,
      username: userName,
      email: email,
    });
    $('#hostButton').addClass('disabled');
    $('#hostButton').off('click');
  }
};

// var startGame = function (gameCode) {
//   socket.emit('startGame', { code: gameCode });
// };

var startGame = function (gameCode) {
  socket.emit('startGame', { code: gameCode });
};

var result = function () {
  socket.emit('result', { code: codeValue });
}

var fold = function () {
  var x = document.getElementById("fold");
  x.play();
  clearInterval(downloadTimer);
  time = 15
  socket.emit('moveMade', { move: 'fold', bet: 'Fold', code: codeValue });
};

var bet = function () {
  if (parseInt($('#betRangeSlider').val()) == 0) {
    Materialize.toast('You must bet more than $0! Try again.', 4000);
  } else if (parseInt($('#betRangeSlider').val()) < 2) {
    Materialize.toast('The minimum bet is $2.', 4000);
  } else {
    clearInterval(downloadTimer);
    time = 15
    socket.emit('moveMade', {
      move: 'bet',
      bet: parseInt($('#betRangeSlider').val()),
      code: codeValue
    });
  }
};

function call() {
  var x = document.getElementById("call");
  x.play();
  clearInterval(downloadTimer);
  time = 15
  socket.emit('moveMade', { move: 'call', bet: 'Call', code: codeValue });
}

var check = function () {
  var x = document.getElementById("check");
  x.play();

  clearInterval(downloadTimer);
  time = 15
  socket.emit('moveMade', { move: 'check', bet: 'Check', code: codeValue });
};

var raise = function () {
  if (
    parseInt($('#raiseRangeSlider').val()) == $('#raiseRangeSlider').prop('min')
  ) {
    Materialize.toast(
      'You must raise higher than the current top bet! Try again.',
      4000
    );
  } else {
    var x = document.getElementById("raise");
    x.play();
    clearInterval(downloadTimer);
    time = 15
    socket.emit('moveMade', {
      move: 'raise',
      bet: parseInt($('#raiseRangeSlider').val()),
      code: codeValue
    });
  }
};

function renderCard(card) {
  if (card.suit == '???' || card.suit == '???')
    return (
      '<div class="playingCard_black" id="card"' +
      card.value +
      card.suit +
      '" data-value="' +
      card.value +
      ' ' +
      card.suit +
      '">' +
      card.value +
      ' ' +
      card.suit +
      '</div>'
    );
  else
    return (
      '<div class="playingCard_red" id="card"' +
      card.value +
      card.suit +
      '" data-value="' +
      card.value +
      ' ' +
      card.suit +
      '">' +
      card.value +
      ' ' +
      card.suit +
      '</div>'
    );
}

function renderOpponent(name, streak, data) {
  console.log("++++++++++", data.money)
  var bet = 0;
  if (data.bets != undefined) {
    var arr = data.bets[data.bets.length - 1];
    for (var pn = 0; pn < arr.length; pn++) {
      if (arr[pn].player == name) bet = arr[pn].bet;
    }
  }
  var buyInsText =
    data.buyIns > 0 ? (data.buyIns > 1 ? 'buy-ins' : 'buy-in') : '';
  if (data.buyIns > 0) {
    if (data.text == 'Fold') {
      return (
        '<div class="circle opponentCard">' +
        '<div class="card grey">' +
        '<div class="card-content arrangeStreak">' +
        '<span class="card-title final-style">' +
        '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />'
        + '<div class="opponent-cards-arran">' + name + '<br/>' +
        ' (Fold)' +
        '<div class="card-action" style="font-size: 20px;">$' +
        data.money +
        '</div></div>' +
        '</span>' +
        '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
        // '<p><div class="center-align"></div><br />' +
        // data.blind +
        // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        // '</div>' +
        '</div>' +
        '</div></div>'
      );
    } else {
      if (data.text == 'Their Turn') {
        console.log("checked", data.isChecked)
        if (data.isChecked)
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3 borderhighlight"><div class="card-content black-text arrangeStreak"><span class="card-title final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<br/>Check' +
            '<div class="card-action" style="font-size: 20px; display:flex;">$' +
            data.money + '<span class="loan-design"><img src="hand-holding-usd-solid.svg" class="hands"></i>' + data.buyIns + '</span>' +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            // '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3 borderhighlight"><div class="card-content black-text arrangeStreak"><span class="card-title final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<div class="card-action" style="font-size: 20px; display:flex;">$' +
            data.money + '<span class="loan-design"><img src="hand-holding-usd-solid.svg" class="hands"></i>' + data.buyIns + '</span>' +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'

            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            // '</div></div></div>'
          );
        } else {
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3 borderhighlight"><div class="card-content black-text arrangeStreak"><span class="card-title final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<br />Bet: $' +
            bet +

            '<div class="card-action" style="font-size: 20px; display:flex;">$' +
            data.money + '<span class="loan-design"><img src="hand-holding-usd-solid.svg" class="hands"></i>' + data.buyIns + '</span>' +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br /><br /><br /><br /><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            // '</div></div></div>'
          );
        }
      } else {
        if (data.isChecked)
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content arrangeStreak"><span class="card-title final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<br/>Check' +
            '<div class="card-action" style="font-size: 20px; display:flex;">$' +
            data.money + '<span class="loan-design"><img src="hand-holding-usd-solid.svg" class="hands"></i>' + data.buyIns + '</span>' +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br /><br /><br /><br /><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            // '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content arrangeStreak"><span class="card-title final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +

            '<div class="card-action" style="font-size: 20px; display:flex;">$' +
            data.money + '<span class="loan-design"><img src="hand-holding-usd-solid.svg" class="hands"></i>' + data.buyIns + '</span>' +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br /><br /><br /><br /><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            // '</div></div></div>'
          );
        } else {
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content arrangeStreak"><span class="card-title">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<br />Bet: $' +
            bet +
            '<div class="card-action" style="font-size: 20px; display:flex;">$' +
            data.money + '<span class="loan-design"><img src="hand-holding-usd-solid.svg" class="hands"></i>' + data.buyIns + '</span>' +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br /><br /><br /><br /><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            // '</div></div></div>'
          );
        }
      }
    }
  }
  // buy-ins rendering
  else {
    if (data.text == 'Fold') {
      return (
        '<div class="circle opponentCard"><div class="card grey"><div class="card-content arrangeStreak"><span class="card-title final-style">' +
        '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name + '<br/>' +
        ' (Fold)' +
        '<div class="card-action" style="font-size: 20px;">$' +
        data.money +
        '</div></div>' +
        '</span>' +
        '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
        // <p><div class="center-align"></div><br />' +
        // data.blind +
        // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        // '</div>' +
        '</div>' +
        '</div></div>'
        // '<br />' +
        // data.text +
        // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        // '</div></div></div>'
      );
    } else {
      if (data.text == 'Their Turn') {
        if (data.isChecked)
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3 borderhighlight "><div class="card-content black-text arrangeStreak"><span class="card-title black-text final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<br/>Check' +
            '<div class="card-action" style="font-size: 20px;">$' +
            data.money +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'

            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3 borderhighlight"><div class="card-content black-text arrangeStreak"><span class="card-title black-text final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<div class="card-action" style="font-size: 20px;">$' +
            data.money +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div></div></div>'
          );
        } else {
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3 borderhighlight"><div class="card-content black-text arrangeStreak"><span class="card-title black-text final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<br />Bet: $' +
            bet +
            '<div class="card-action" style="font-size: 20px;">$' +
            data.money +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div></div></div>'
          );
        }
      } else {
        if (data.isChecked)
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content arrangeStreak"><span class="card-title final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<br />Check' +
            '<div class="card-action" style="font-size: 20px;">$' +
            data.money +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br /><br /><br /><br /><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content arrangeStreak"><span class="card-title final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<div class="card-action" style="font-size: 20px;">$' +
            data.money +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br /><br /><br /><br /><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div></div></div>'
          );
        } else {
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content arrangeStreak"><span class="card-title final-style">' +
            '<div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" />' + '<div class="opponent-cards-arran">' + name +
            '<br />Bet: $' +
            bet +
            '<div class="card-action" style="font-size: 20px;">$' +
            data.money +
            '</div></div>' +
            '</span>' +
            '<div class="streakDisplay" > <i class="fa fa-trophy trophysymb"></i>' + streak + '</div>' +
            // <p><div class="center-align"></div><br /><br /><br /><br /><br />' +
            // data.blind +
            // '<div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div>' +
            '</div>' +
            '</div></div>'
            // '<br />' +
            // data.text +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // '</div></div></div>'
          );
        }
      }
    }
  }
}

function renderOpponentScore(name, data) {
  var bet = 0;
  if (data.bets != undefined) {
    var arr = data.bets[data.bets.length - 1];
    for (var pn = 0; pn < arr.length; pn++) {
      if (arr[pn].player == name) bet = arr[pn].bet;
    }
  }
  var buyInsText =
    data.buyIns > 0 ? (data.buyIns > 1 ? 'buy-ins' : 'buy-in') : '';
  if (data.buyIns > 0) {
    if (data.text == 'Fold') {
      return (
        '<div class="col s12 m2 opponentCard"><div class="card grey"><div class=" white-text"><span class="card-title">' +
        name + ':' + '&nbsp;' + '$' + data.money + "-" + data.buyIns + buyInsText +
        // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        // ' (' +
        // data.buyIns +
        // ' ' +
        // buyInsText +
        // ')' +
        '</div></div>'
      );
    } else {
      if (data.text == 'Their Turn') {
        if (data.isChecked)
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class=" black-text"><span class="card-title">' +
            name + ':' + '&nbsp;' + '$' + data.money + "-" + data.buyIns + buyInsText +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            '</div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class=" black-text"><span class="card-title">' +
            name + ':' + '&nbsp;' + '$' + data.money + "-" + data.buyIns + buyInsText +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            '</div></div>'
          );
        } else {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class=" black-text"><span class="card-title">' +
            name + ':' + '&nbsp;' + '$' + data.money + "-" + data.buyIns + buyInsText +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            '</div></div>'
          );
        }
      } else {
        if (data.isChecked)
          return (
            '<div class="col s12 m2 opponentCard"><div class="card highlight" ><div class=" white-text"><span class="card-title">' +
            name + ':' + '&nbsp;' + '$' + data.money + "-" + data.buyIns + buyInsText +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            '</div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card highlight" ><div class=" white-text"><span class="card-title">' +
            name + ':' + '&nbsp;' + '$' + data.money + "-" + data.buyIns + buyInsText +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            '</div></div>'
          );
        } else {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card highlight" ><div class=" white-text"><span class="card-title">' +
            name + ':' + '&nbsp;' + '$' + data.money + "-" + data.buyIns + buyInsText +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            // ' (' +
            // data.buyIns +
            // ' ' +
            // buyInsText +
            // ')' +
            '</div></div>'
          );
        }
      }
    }
  }
  // buy-ins rendering
  else {
    if (data.text == 'Fold') {
      return (
        '<div class="col s12 m2 opponentCard"><div class="card grey"><div class=" white-text"><span class="card-title">' +
        name + ':' + '&nbsp;' + '$' + data.money +
        // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        '</div></div>'
      );
    } else {
      if (data.text == 'Their Turn') {
        if (data.isChecked)
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class=" black-text"><span class="card-title black-text">' +
            name + ':' + '&nbsp;' + '$' + data.money +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            '</div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class=" black-text"><span class="card-title black-text">' +
            name + ':' + '&nbsp;' + '$' + data.money +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            '</div></div>'
          );
        } else {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card yellow darken-3"><div class=" black-text"><span class="card-title black-text">' +
            name + ':' + '&nbsp;' + '$' + data.money +
            // '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            // data.money +
            '</div></div>'
          );
        }
      } else {
        if (data.isChecked)
          return (
            '<div class="col s12 m2 opponentCard"><div class="card highlight" ><div class=" white-text"><span class="card-title">' +
            name + ':' + '&nbsp;' + '$' + data.money +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            '</div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card highlight" ><div class=" white-text"><span class="card-title">' +
            name + ':' + '&nbsp;' + '$' + data.money +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            '</div></div>'
          );
        } else {
          return (
            '<div class="col s12 m2 opponentCard"><div class="card highlight" ><div class=" white-text"><span class="card-title">' +
            name + ':' + '&nbsp;' + '$' + data.money +
            // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            // data.money +
            '</div></div>'
          );
        }
      }
    }
  }
}



function renderOpponentCards(name, data) {
  var bet = 0;
  if (data.bets != undefined) {
    var arr = data.bets[data.bets.length - 1].reverse();
    for (var pn = 0; pn < arr.length; pn++) {
      if (arr[pn].player == name) bet = arr[pn].bet;
    }
  }
  var buyInsText2 =
    data.buyIns > 0 ? (data.buyIns > 1 ? 'buy-ins' : 'buy-in') : '';
  if (data.buyIns > 0) {
    if (data.folded)
      return (
        '<div class="circle opponentCard"><div class="card grey card-final folded-end final-shadow" ><div class="card-content"><span class="card-title">' +
        name +
        // ' | Bet: $' +
        // bet 
        +
        '<div class="card-action" style="font-size: 20px;">$' +
        data.money +
        '</div>' +
        '</span>' +
        // <p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br /><br /></p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        // ' (' +
        // data.buyIns +
        // ' ' +
        // buyInsText2 +
        // ')' +
        '</div></div></div>'
      );
    else
      return (
        '<div class="circle opponentCard"><div class="card card-final final-shadow" >' +
        '<div class="card-content"><span class="final-style">' +
        '<div class="center-align final-style"> ' +
        renderOpponentCard(data.cards[0]) +
        renderOpponentCard(data.cards[1]) +
        ' </div>' + '<div class="black-text final-text">' +
        '<p class="finaltextName">' + name + '</p>'
        +
        data.endHand +
        '<div class="card-action center-align" style="font-size: 20px;">$' +
        data.money +
        // ' | Bet: $' +
        // bet +
        '</div></div></span>' +
        // '<div class="center-align"> ' +
        // renderOpponentCard(data.cards[0]) +
        // renderOpponentCard(data.cards[1]) +
        // ' </div>' +

        '</div></div></div>'
      );
  } else {
    if (data.folded)
      return (
        '<div class="circle opponentCard"><div class="card grey card-final folded-end final-shadow" ><div class="card-content"><span class="card-title">' +
        name +
        '<div class="card-action" style="font-size: 20px;">$' +
        data.money +
        '</div>' +
        // ' | Bet: $' +
        // bet +
        '</span>' +
        // <p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /></p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px; margin-top: 67px;">$' +
        // data.money +
        '</div></div></div>'
      );
    else
      return (
        '<div class="circle opponentCard"><div class="card card-final final-shadow" >' +

        '<div class="card-content"><span class="final-style">' +
        '<div class="center-align final-style">' +
        renderOpponentCard(data.cards[0]) +
        renderOpponentCard(data.cards[1]) +
        ' </div>' + '<div class="black-text final-text">' +
        '<p class="finaltextName">' + name + '</p>' +
        '<p class="predictguess">' +
        data.endHand + '</p>' +
        '<div class="card-action center-align" style="font-size: 20px;">$' +
        data.money +
        // ' | Bet: $' +
        // bet +
        '</div></div></span>' +
        // '<div class="center-align"> ' +
        // renderOpponentCard(data.cards[0]) +
        // renderOpponentCard(data.cards[1]) +
        // ' </div>'+

        '</div></div></div>'
      );
  }
}

function renderOpponentScoreCards(name, data) {
  var bet = 0;
  if (data.bets != undefined) {
    var arr = data.bets[data.bets.length - 1].reverse();
    for (var pn = 0; pn < arr.length; pn++) {
      if (arr[pn].player == name) bet = arr[pn].bet;
    }
  }
  var buyInsText2 =
    data.buyIns > 0 ? (data.buyIns > 1 ? 'buy-ins' : 'buy-in') : '';
  if (data.buyIns > 0) {
    if (data.folded)
      return (
        '<div class="col s12 m2 opponentCard"><div class="card grey" ><div class=" white-text"><span class="card-title">' +
        name + ':' + '&nbsp;' + '$' + data.money +
        // '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br /><br /></p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        // ' (' +
        // data.buyIns +
        // ' ' +
        // buyInsText2 +
        // ')' +
        '</div></div>'
      );
    else
      return (
        '<div class="col s12 m2 opponentCard"><div class="card highlight" ><div class=" white-text"><span class="card-title">' +
        name + ':' + '&nbsp;' + '$' + data.money +
        // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        // ' (' +
        // data.buyIns +
        // ' ' +
        // buyInsText2 +
        // ')' +
        '</div></div>'
      );
  } else {
    if (data.folded)
      return (
        '<div class="col s12 m2 opponentCard"><div class="card grey" ><div class=" white-text"><span class="card-title">' +
        name + ':' + '&nbsp;' + '$' + data.money +
        // '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br /><br /></p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        '</div></div>'
      );
    else
      return (
        '<div class="col s12 m2 opponentCard"><div class="card highlight" ><div class=" white-text"><span class="card-title">' +
        name + ':' + '&nbsp;' + '$' + data.money +
        // '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        // data.money +
        '</div></div>'
      );
  }
}

function renderOpponentCard(card) {
  if (card.suit == '???' || card.suit == '???')
    return (
      '<div class="playingCard_black_opponent" id="card"' +
      card.value +
      card.suit +
      '" data-value="' +
      card.value +
      ' ' +
      card.suit +
      '">' +
      card.value +
      ' ' +
      card.suit +
      '</div>'
    );
  else
    return (
      '<div class="playingCard_red_opponent" id="card"' +
      card.value +
      card.suit +
      '" data-value="' +
      card.value +
      ' ' +
      card.suit +
      '">' +
      card.value +
      ' ' +
      card.suit +
      '</div>'
    );
}

function updateBetDisplay() {
  var x = document.getElementById("raise");
  x.play();
  if ($('#betRangeSlider').val() == $('#usernamesMoney').text()) {
    $('#betDisplay').html(
      '<h3 class="center-align">All-In $' +
      $('#betRangeSlider').val() +
      '</h36>'
    );
  } else {
    $('#betDisplay').html(
      '<h3 class="center-align">$' + $('#betRangeSlider').val() + '</h36>'
    );
  }
}

function updateBetModal() {
  $('#betDisplay').html('<h3 class="center-align">$0</h3>');
  document.getElementById('betRangeSlider').value = 0;
  var usernamesMoneyStr = $('#usernamesMoney').text().replace('$', '');
  var usernamesMoneyNum = parseInt(usernamesMoneyStr);
  $('#betRangeSlider').attr({
    max: usernamesMoneyNum,
    min: 0,
  });
}

function updateRaiseDisplay() {
  $('#raiseDisplay').html(
    '<h3 class="center-align">Raise top bet to $' +
    $('#raiseRangeSlider').val() +
    '</h3>'
  );
}

socket.on('updateRaiseModal', function (data) {
  $('#raiseRangeSlider').attr({
    max: data.usernameMoney,
    min: data.topBet,
  });
});

function updateRaiseModal() {
  document.getElementById('raiseRangeSlider').value = 0;
  socket.emit('raiseModalData', {});
}

socket.on('displayPossibleMoves', function (data) {
  console.log('possiblemoves', data)
  console.log('globaltimer', time)
  let findDisconnect = data.findDisconnectPlayer

  if (data.fold == 'yes') $('#usernameFold').show();
  else $('#usernameHide').hide();
  if (data.check == 'yes') $('#usernameCheck').show();
  else $('#usernameCheck').hide();
  if (data.bet == 'yes') $('#usernameBet').show();
  else $('#usernameBet').hide();
  if (data.call != 'no' || data.call == 'all-in') {
    $('#usernameCall').show();
    if (data.call == 'all-in') $('#usernameCall').text('Call All-In');
    else $('#usernameCall').text('Call $' + data.call);
  } else $('#usernameCall').hide();
  if (data.raise == 'yes') $('#usernameRaise').show();
  else $('#usernameRaise').hide();
  if (data.timmer === 'yes' && findDisconnect === 'no') {

    // if(data.timmer === 'yes'){
    console.log('if part');

    time = 15;
    downloadTimer = setInterval(function () {
      if (time <= 0) {
        clearInterval(downloadTimer);
        //  document.getElementById("countdown").innerHTML = "Finished";
        socket.emit('moveMade', { move: 'fold', bet: 'Fold', code: codeValue });
        //  time=15
        // time=0;

      } else {
        document.getElementById("countdown").value = time ;
      }
      //  timmer=time
      time -= 1;
    }, 1000);

    $('#countdown').show()
  }

  if (findDisconnect === 'yes') {
    if (time === undefined) {
      time = 15
      downloadTimer = setInterval(function () {
        if (time <= 0) {
          clearInterval(downloadTimer);
          socket.emit('moveMade', { move: 'fold', bet: 'Fold', code: codeValue });
          time = 15
        } else {
          document.getElementById("countdown").value = time;
        }
        time -= 1;
      }, 1000);
    } else {
      clearInterval(downloadTimer);
      downloadTimer = setInterval(function () {
        if (time <= 0) {
          clearInterval(downloadTimer);
          socket.emit('moveMade', { move: 'fold', bet: 'Fold', code: codeValue });
          time = 15
        } else {
          document.getElementById("countdown").value = time;
        }
        time -= 1;
      }, 1000);
    }
    $('#countdown').show()
  }
});

function renderSelf(data) {
  $('#playNext').empty();
  $('#usernamesMoney').text('$' + data.money);
  if (data.text == 'Their Turn') {
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').addClass('yellow');
    $('#playerInformationCard').addClass('darken-2');
    $('#usernamesCards').removeClass('white-text');
    $('#usernamesCards').addClass('black-text');
    $('#status').text('My Turn');
    Materialize.toast('My Turn', 4000);
    socket.emit('evaluatePossibleMoves', {});
  } else if (data.text == 'Fold') {
    $('#status').text('You Folded');
    $('#playerInformationCard').removeClass('green');
    $('#playerInformationCard').removeClass('yellow');
    $('#playerInformationCard').removeClass('darken-2');
    $('#playerInformationCard').addClass('grey');
    $('#usernamesCards').removeClass('black-text');
    $('#usernamesCards').addClass('white-text');
    Materialize.toast('You folded', 3000);
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    $('#countdown').hide()
  } else {
    $('#status').text('');
    $('#usernamesCards').removeClass('black-text');
    $('#usernamesCards').addClass('white-text');
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').removeClass('yellow');
    $('#playerInformationCard').removeClass('darken-2');
    $('#playerInformationCard').addClass('green');
    $('#playerInformationCard').removeClass('theirTurn');
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    $('#countdown').hide()
  }
  $('#blindStatus').text(data.blind);
}

function renderSelfScoreboard(data) {
  $('#playNext').empty();
  $('#usernamesMoney').text('$' + data.money);
  if (data.text == 'Their Turn') {
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').addClass('yellow');
    $('#playerInformationCard').addClass('darken-2');
    $('#usernamesCards').removeClass('white-text');
    $('#usernamesCards').addClass('black-text');
    $('#status').text('My Turn');
    Materialize.toast('My Turn', 4000);
    socket.emit('evaluatePossibleMoves', {});
  } else if (data.text == 'Fold') {
    $('#status').text('You Folded');
    $('#playerInformationCard').removeClass('green');
    $('#playerInformationCard').removeClass('yellow');
    $('#playerInformationCard').removeClass('darken-2');
    $('#playerInformationCard').addClass('grey');
    $('#usernamesCards').removeClass('black-text');
    $('#usernamesCards').addClass('white-text');
    Materialize.toast('You folded', 3000);
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    $('#countdown').hide()
  } else {
    $('#status').text('');
    $('#usernamesCards').removeClass('black-text');
    $('#usernamesCards').addClass('white-text');
    $('#playerInformationCard').removeClass('grey');
    $('#playerInformationCard').removeClass('yellow');
    $('#playerInformationCard').removeClass('darken-2');
    $('#playerInformationCard').removeClass('green');
    $('#playerInformationCard').addClass('blue');
    $('#playerInformationCard').removeClass('theirTurn');
    $('#usernameFold').hide();
    $('#usernameCheck').hide();
    $('#usernameBet').hide();
    $('#usernameCall').hide();
    $('#usernameRaise').hide();
    $('#countdown').hide()
  }
  $('#blindStatus').text(data.blind);
}


// CHAT SYSTEM

var messages = document.getElementById('messages');
var form = document.getElementById('form');
var input = document.getElementById('input');

form.addEventListener('submit', function (e) {
  e.preventDefault();
  if (input.value) {
    var data = {
      "message": input.value,
      "username": user
    }
    socket.emit('chat message', data);
    input.value = '';
  }
})

socket.on('chat message', function (data) {
  const username = data.username;
  console.log(username)
  var item = document.createElement('li');
  // item.innerHTML += `<b>${username}</>`
  item.style.backgroundColor = 'white';
  item.style.borderRadius = '5px';
  item.style.paddingLeft = '5px';
  item.style.margin = '7px';
  item.innerHTML = "<p class='messagename'>" + username + "</p>" + '<p class="messagechat">' + data.message + '</p>';
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
})

function adminAmountSubmit() {
  let dia = document.getElementById("money")
  const data = {
    "smallBlind": parseInt($('#amountsb').val()),
    "bigBlind": parseInt($('#amountbb').val())
  }
  console.log('dta', data)
  socket.emit('updateblinds', data)
  dia.close()
}
var url_string = location.href
var url = new URL(url_string);
// var codeValue = url.searchParams.get("token"); 
if (codeValue == null) {
  let dialog = document.getElementById("money")
  //document.getElementById('custom').innerHTML = "Blind Levels"
  document.getElementById('custom').addEventListener('click', () => {
    let dia = document.getElementById("money")
    dia.showModal();
    var data = "SB Amount:<br><input type='text' id='amountsb' name='amountsb'><br>BB amount<input id='amountbb' type='text' name='amountbb'><br><button  id='btnsubmit' onclick='adminAmountSubmit()'>submit</button>"
    dia.innerHTML = data
    document.getElementById('btnsubmit').style.position = 'absolute';


    var btn = document.createElement('button');
    btn.textContent = 'Close';
    btn.style.marginLeft = "338px"
    btn.style.marginTop = "7px"
    btn.addEventListener("click", function () {
      dia.close()
    });
    dialog.appendChild(btn);
  })
} else {
  // document.getElementById('custom').style.display = "none"
}


