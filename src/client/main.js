
$(document).ready(function () {
  $('#gameDiv').hide();
  $('.modal-trigger').leanModal();
  $('.tooltipped').tooltip({ delay: 50 });

});

var socket = io();
var gameInfo = null;

let user;

var url_string = location.href
var url = new URL(url_string);
var codeValue = url.searchParams.get("token");


if (codeValue !== null) {
  console.log('code:', codeValue)
  document.getElementById("hostButton").style.display = "none";
  document.getElementById("joinButton").style.display = "inherit";
}

function updateblinds() {
  const data = {
    "smallBlind": 20,
    "bigBlind": 40
  }
  socket.emit('updateblinds', data)
}
socket.on('playerDisconnected', function (data) {
  Materialize.toast(data.player + ' disconnected.', 4000);
});

socket.on('hostRoom', function (data) {
  if (data != undefined) {
    if (data.players.length >= 11) {
      $('#hostModalContent').html(
        '<h5>Code:</h5><code>' +
        data.code +
        '</code><br /><h5>Warning: you have too many players in your room. Max is 11.</h5><h5>Players Currently in My Room</h5>'
      );
      $('#playersNames').html(
        data.players.map(function (p) {
          return '<span>' + p + '</span><br />';
        })
      );
    } else if (data.players.length > 1) {
      $('#hostModalContent').html(
        '<h5>Code:</h5><code>' +
        window.location.href + 'playgame?token=' + data.code +
        '</code><br /><h5>Players Currently in My Room</h5>'
      );
      $('#playersNames').html(
        data.players.map(function (p) {
          return '<span>' + p + '</span><br />';
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
        data.players.map(function (p) {
          return '<span>' + p + '</span><br />';
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
    data.players.map(function (p) {
      return '<span>' + p + '</span><br />';
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
    data.players.map(function (p) {
      return '<span>' + p + '</span><br />';
    })
  );
});

socket.on('getresult', function (data) {
  let dia = document.getElementById("myDialogother")
  dia.showModal();
  // points.sort(function(a, b){return b - a});
  var listItems = data.sort((a, b) => (a.money > b.money ? -1 : (b.money > a.money) ? 1 : 0)).map(function (item, index) {
    console.log(item)
    return '<div style ="font-size:1.5em">' + (parseInt(index) + 1) + "&nbsp" + item.username + "&nbsp" + "=>" + "&nbsp" + item.money + "." + '</div>'
  })

  dia.innerHTML = listItems

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
})

socket.on('joinRoom', function (data) {
  if (data == undefined) {
    $('#joinModal').closeModal();
    Materialize.toast(
      "Enter a valid name/code! (max length of name is 12 characters & cannot be the same as someone else's)",
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
    console.log(data);
    $('#joinModalContent').html(
      '<h5>' +
      data.host +
      "'s room</h5><hr /><h5>Players Currently in Room</h5><p>Please wait until your host starts the game. Leaving the page, refreshing, or going back will disconnect you from the game. </p>"
    );
    $('#playersNamesJoined').html(
      data.players.map(function (p) {
        return '<span>' + p + '</span><br />';
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
    '    |    ' +
    data.stage +
    '    |    Current Top Bet: $' +
    data.topBet +
    '    |    Pot: $' +
    data.pot
  );
  $('#opponentCards').html(
    data.players.map(function (p) {
      return renderOpponent(p.username, {
        text: p.status,
        money: p.money,
        blind: p.blind,
        bets: data.bets,
        buyIns: p.buyIns,
        isChecked: p.isChecked,
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
    var x = document.getElementById("bgmusic");
    x.play();
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
    ' <button onClick=result() class="btn white black-text menuButtons">Stop Game</button>'
  )
}
socket.on('reveal', function (data) {
  $('#usernameFold').hide();
  $('#usernameCheck').hide();
  $('#usernameBet').hide();
  $('#usernameCall').hide();
  $('#usernameRaise').hide();

  for (var i = 0; i < data.winners.length; i++) {
    if (data.winners[i] == data.username) {
      Materialize.toast('You won the hand!', 4000);
      break;
    }
  }
  $('#table-title').text('Hand Winner(s): ' + data.winners);

  if (codeValue === null) {
    $('#playNext').html(
      '<button onClick=playNext() id="playNextButton" class="btn white black-text menuButtons">Start Next Game</button>'
    );
    // $('#stopGame').html(
    //   // '<a href="#hostModal"> Stop Game</button></a>'
    //   ' <button onClick=stopGame() class="btn white black-text menuButtons">Stop Game</button>'
    // )
  }
  if (codeValue !== null) {

    $('#showscore').html(
      '<button onClick=result()  class="btn white black-text menuButtons">Show score</button></a>'
    )
  }
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

function stopGame() {
  let dia = document.getElementById("myDialogother")
  dia.showModal();

  var html = "";
  html += "Scoreboard" + "<br/>";
  html += "winner 1=" + "akshay" + "<br/>";
  html += "winner 2=" + "maity" + "<br/>";
  html += "winner 3=" + "sita" + "<br/>";
  html += "winner 4=" + "sdf" + "<br/>";

  dia.innerHTML = html;

  var btn = document.createElement('button');
  btn.textContent = 'Close';
  btn.style.marginLeft = "338px"
  btn.style.marginTop = "246px"
  btn.addEventListener("click", function () {
    if (codeValue === null) {
      location.reload()
    }
    if (codeValue !== null) {
      dia.close()
    }
  });
  dia.appendChild(btn);
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
  $('#table-title').text(data.winner + ' takes the pot of $' + data.pot);

  if (codeValue === null) {
    $('#playNext').html(
      '<button onClick=playNext() id="playNextButton" class="btn white black-text menuButtons">Start Next Game</button>'
    );
    // $('#stopGame').html(
    //   // '<button onClick=stopGame() id="playNextButton" class="btn white black-text menuButtons">Stop Game</button>'
    //        '<button onClick=stopGame()  class="btn white black-text menuButtons">Stop Game</button></a>'

    // )
  }
  if (codeValue !== null) {
    $('#showscore').html(
      '<button onClick=result()()  class="btn white black-text menuButtons">Show score</button></a>'
    )
  }
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
  }
  $('#usernamesMoney').text('$' + data.money);
  $('#opponentCards').html(
    data.cards.map(function (p) {
      return renderOpponent(p.username, {
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
  if ($('#hostName-field').val() == '') {
    $('.toast').hide();
    $('#hostModal').closeModal();
    Materialize.toast(
      'Enter a valid name! (max length of name is 12 characters)',
      4000
    );
    $('#joinButton').removeClass('disabled');
  } else if ($('#hostEmail-field').val() == '' || $('#hostEmail-field').val().includes('@') == false) {
    $('.toast').hide();
    $('#hostModal').closeModal();
    Materialize.toast(
      'Please enter a valid email',
      4000
    );
    $('#joinButton').removeClass('disabled');
  } else {
    user = $('#hostName-field').val()
    socket.emit('host', { username: $('#hostName-field').val(), email: $('#hostEmail-field').val() });
    $('#joinButton').addClass('disabled');
    $('#joinButton').off('click');
  }
};
var url_string = window.location.href;
var url = new URL(url_string);
var codeValue = url.searchParams.get("token");

var joinRoom = function () {

  // yes, i know this is client-side.
  if (
    $('#joinName-field').val() == '' ||
    $('#email-field').val() == '' ||
    $('#joinName-field').val().length > 12
  ) {
    $('.toast').hide();
    Materialize.toast(
      'Enter a your name/Email (max length of name is 12 characters.)',
      4000
    );
    $('#joinModal').closeModal();
    $('#hostButton').removeClass('disabled');
    $('#hostButton').on('click');
  } else if ($('#email-field').val() == '' && $('#email-field').val().includes('@') == false) {
    $('.toast').hide();
    Materialize.toast(
      'Enter a your valid Email! ',
      4000
    );
    $('#joinModal').closeModal();
    $('#hostButton').removeClass('disabled');
    $('#hostButton').on('click');
  } else {
    user = $('#joinName-field').val();
    socket.emit('join', {
      code: codeValue,
      username: $('#joinName-field').val(),
      email: $('#email-field').val(),
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
  socket.emit('result', {});
}

var fold = function () {
  var x = document.getElementById("fold");
  x.play();
  socket.emit('moveMade', { move: 'fold', bet: 'Fold' });
};

var bet = function () {
  if (parseInt($('#betRangeSlider').val()) == 0) {
    Materialize.toast('You must bet more than $0! Try again.', 4000);
  } else if (parseInt($('#betRangeSlider').val()) < 2) {
    Materialize.toast('The minimum bet is $2.', 4000);
  } else {
    socket.emit('moveMade', {
      move: 'bet',
      bet: parseInt($('#betRangeSlider').val()),
    });
  }
};

function call() {
  var x = document.getElementById("call");
  x.play();
  socket.emit('moveMade', { move: 'call', bet: 'Call' });
}

var check = function () {
  var x = document.getElementById("check");
  x.play();
  socket.emit('moveMade', { move: 'check', bet: 'Check' });
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
    socket.emit('moveMade', {
      move: 'raise',
      bet: parseInt($('#raiseRangeSlider').val()),
    });
  }
};

function renderCard(card) {
  if (card.suit == '♠' || card.suit == '♣')
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

function renderOpponent(name, data) {
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
        '<div class="circle opponentCard"><div class="card grey"><div class="card-content"><span class="card-title">' +
        name + '<br/>' +
        ' (Fold)</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br />' +
        data.blind +
        '<br />' +
        data.text +
        '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        data.money +
        ' (' +
        data.buyIns +
        ' ' +
        buyInsText +
        ')' +
        '</div></div></div>'
      );
    } else {
      if (data.text == 'Their Turn') {
        if (data.isChecked)
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title">' +
            name +
            '<br />Check</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title">' +
            name +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        } else {
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title">' +
            name +
            '<br />Bet: $' +
            bet +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        }
      } else {
        if (data.isChecked)
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content"><span class="card-title">' +
            name +
            '<br />Check</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content"><span class="card-title">' +
            name +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        } else {
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content"><span class="card-title">' +
            name +
            '<br />Bet: $' +
            bet +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            data.money +
            ' (' +
            data.buyIns +
            ' ' +
            buyInsText +
            ')' +
            '</div></div></div>'
          );
        }
      }
    }
  }
  // buy-ins rendering
  else {
    if (data.text == 'Fold') {
      return (
        '<div class="circle opponentCard"><div class="card grey"><div class="card-content"><span class="card-title">' +
        name + '<br/>' +
        ' (Fold)</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br />' +
        data.blind +
        '<br />' +
        data.text +
        '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        data.money +
        '</div></div></div>'
      );
    } else {
      if (data.text == 'Their Turn') {
        if (data.isChecked)
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title black-text">' +
            name +
            '<br />Check</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            data.money +
            '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title black-text">' +
            name +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            data.money +
            '</div></div></div>'
          );
        } else {
          return (
            '<div class="circle opponentCard"><div class="card yellow darken-3"><div class="card-content black-text"><span class="card-title black-text">' +
            name +
            '<br />Bet: $' +
            bet +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action yellow lighten-1 black-text center-align" style="font-size: 20px;">$' +
            data.money +
            '</div></div></div>'
          );
        }
      } else {
        if (data.isChecked)
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content"><span class="card-title">' +
            name +
            '<br />Check</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            data.money +
            '</div></div></div>'
          );
        else if (bet == 0) {
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content"><span class="card-title">' +
            name +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            data.money +
            '</div></div></div>'
          );
        } else {
          return (
            '<div class="circle opponentCard"><div class="card highlight highborder" ><div class="card-content"><span class="card-title">' +
            name +
            '<br />Bet: $' +
            bet +
            '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br />' +
            data.blind +
            '<br />' +
            data.text +
            '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
            data.money +
            '</div></div></div>'
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
        '<div class="circle opponentCard"><div class="card grey card-final" ><div class="card-content"><span class="card-title">' +
        name +
        ' | Bet: $' +
        bet +
        '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /><br /><br /><br /><br /><br /></p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        data.money +
        ' (' +
        data.buyIns +
        ' ' +
        buyInsText2 +
        ')' +
        '</div></div></div>'
      );
    else
      return (
        '<div class="circle opponentCard"><div class="card card-final" ><div class="card-content"><span class="card-title">' +
        name +
        ' | Bet: $' +
        bet +
        '</span><p><div class="center-align"> ' +
        renderOpponentCard(data.cards[0]) +
        renderOpponentCard(data.cards[1]) +
        ' </div><br />' +
        data.endHand +
        '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        data.money +
        ' (' +
        data.buyIns +
        ' ' +
        buyInsText2 +
        ')' +
        '</div></div></div>'
      );
  } else {
    if (data.folded)
      return (
        '<div class="circle opponentCard"><div class="card grey card-final" ><div class="card-content"><span class="card-title">' +
        name +
        ' | Bet: $' +
        bet +
        '</span><p><div class="center-align"><div class="blankCard" id="opponent-card" /><div class="blankCard" id="opponent-card" /></div><br /></p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px; margin-top: 67px;">$' +
        data.money +
        '</div></div></div>'
      );
    else
      return (
        '<div class="circle opponentCard"><div class="card card-final" ><div class="card-content"><span class="card-title">' +
        name +
        ' | Bet: $' +
        bet +
        '</span><p><div class="center-align"> ' +
        renderOpponentCard(data.cards[0]) +
        renderOpponentCard(data.cards[1]) +
        ' </div><br />' +
        data.endHand +
        '</p></div><div class="card-action green darken-3 white-text center-align" style="font-size: 20px;">$' +
        data.money +
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
  if (card.suit == '♠' || card.suit == '♣')
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
  item.innerHTML = '<b>' + username + '</b>' + '<br/>' + '&nbsp;' + '<span class="messagetexts">' + data.message + '</span>';
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;
})



