// server-side socket.io backend event handling
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
const Game = require('./classes/game.js');
const path = require('path');
const app = express();
var XMLHttpRequest = require('xhr2');
const nodemailer = require('nodemailer');
app.get(`/playgame`, (req, res) => {
  res.sendFile(path.join(__dirname + '/client/index.html'));
});

const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

app.use('/', express.static(__dirname + '/client'));

let rooms = [];
let codeValue;

io.on('connection', (socket) => {
  console.log('new connection ', socket.id);
  socket.on('host', (data) => {
    if (data.username == '' || data.username.length > 12) {
      socket.emit('hostRoom', undefined);
    } else {
      let code;
      do {
        code =
          '' +
          Math.floor(Math.random() * 10) +
          Math.floor(Math.random() * 10) +
          Math.floor(Math.random() * 10) +
          Math.floor(Math.random() * 10);
      } while (rooms.length != 0 && rooms.some((r) => r.getCode() === code));
      const game = new Game(code, data.username);
      rooms.push(game);
      game.addPlayer(data.username, data.email, socket);
      game.emitPlayers('hostRoom', {
        code: code,
        players: game.getPlayersArray(),
      });
      socket.join(code.toString());

      codeValue = code;
      var url = 'https://immense-dusk-54293.herokuapp.com/api/v1/livegame';

      var xhr = new XMLHttpRequest();
      xhr.open('POST', url);

      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('Content-Type', 'application/json');

      xhr.onreadystatechange = function () {
        if (xhr.readyState === 4) {
          console.log(xhr.status);
          console.log(xhr.responseText);
        }
      };

      var url = `https://aviapoker.herokuapp.com/playgame?token=${code}`
      var data = {
        _id: code,
        name: (data.username + `'s Room`).toString(),
        live: true,
        hostname: data.username,
        url: url
      };

      console.log(JSON.stringify(data));
      xhr.send(JSON.stringify(data));

    }
  });

  socket.on('join', (data) => {
    socket.join(data.code.toString())
    const game = rooms.find((r) => r.getCode() === data.code);
    if (
      game == undefined ||
      game.getPlayersArray().some((p) => p == data.username) ||
      data.username == undefined ||
      data.username.length > 12 ||
      game.getPlayersArray().length > 7
    ) {
      socket.emit('joinRoom', undefined);
    } else if (game.roundNum > 0) {
      var data = 'no';
      socket.emit('joinRoom', data);
    } else {
      game.addPlayer(data.username, data.email, socket);
      rooms = rooms.map((r) => (r.getCode() === data.code ? game : r));
      game.emitPlayers('joinRoom', {
        host: game.getHostName(),
        players: game.getPlayersArray(),
        progress: game.roundInProgress,
      });
      game.emitPlayers('hostRoom', {
        code: data.code,
        players: game.getPlayersArray(),
      });
    }
  });

  socket.on('startGame', (data) => {
    const game = rooms.find((r) => r.getCode() == data.code);
    if (game == undefined) {
      socket.emit('gameBegin', undefined);
    } else {
      game.emitPlayers('gameBegin', { code: data.code });
      game.startGame();
    }
  });

  socket.on('evaluatePossibleMoves', () => {
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );
    if (game.roundInProgress) {
      const possibleMoves = game.getPossibleMoves(socket);
      socket.emit('displayPossibleMoves', possibleMoves);
    }
  });

  socket.on('raiseModalData', () => {
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );
    if (game != undefined) {
      socket.emit('updateRaiseModal', {
        topBet: game.getCurrentTopBet(),
        usernameMoney:
          game.getPlayerBetInStage(game.findPlayer(socket.id)) +
          game.findPlayer(socket.id).getMoney(),
      });
    }
  });

  socket.on('startNextRound', () => {
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );
    if (game != undefined) {
      if (game.roundInProgress === false) {
        game.startNewRound();
      }
    }
  });

  socket.on('timer_turn', (data) => {
    //console.log('timer' + data);
  });
  // precondition: user must be able to make the move in the first place.
  socket.on('moveMade', (data) => {
    // worst case complexity O(num_rooms * num_players_in_room)
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );

    if (game != undefined) {
      io.to(data.code.toString()).emit('ring', data.move);

      if (data.move == 'fold') {
        game.fold(socket);
      } else if (data.move == 'check') {
        game.check(socket);
      } else if (data.move == 'bet') {
        game.bet(socket, data.bet);
      } else if (data.move == 'call') {
        game.call(socket);
      } else if (data.move == 'raise') {
        game.raise(socket, data.bet);
      }
    } else {
      console.log("ERROR: can't find game!!!");
    }
  });

  socket.on('result', (data) => {
    let playersData = [];
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );
    for (let pn = 0; pn < game.getNumPlayers(); pn++) {
      playersData.push({
        username: game.players[pn].getUsername(),
        money: game.players[pn].getMoney(),
        buyIns: game.players[pn].buyIns,
        email: game.players[pn].getEmail(),
      });
    }
    //console.log(playersData);
    // socket.emit('getresult', playersData);

    nonLiveGame(data.code);

    io.to(data.code.toString()).emit('getresult', playersData);

    var url = 'https://immense-dusk-54293.herokuapp.com/api/v1/leaderbaord';

    var xhr = new XMLHttpRequest();
    xhr.open('POST', url);

    xhr.setRequestHeader('Accept', 'application/json');
    xhr.setRequestHeader('Content-Type', 'application/json');

    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        console.log(xhr.status);
        console.log(xhr.responseText);
      }
    };

    let score = [];
    playersData.map((item) => {
      score.push({
        username: item.username.toString(),
        email: item.email.toString(),
        points: (item.money - item.buyIns * 1000).toString(),
      });
    });

    var data = {
      score: score,
    };

    console.log(JSON.stringify(data));
    xhr.send(JSON.stringify(data));

    async function sendMail() {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      let testAccount = await nodemailer.createTestAccount();

      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: 'smtp.office365.com',
        port: 587,
        secureConnection: false,
        secure: false,
        requireTLS: true,
        auth: {
          user: 'games@aviabird.com',
          pass: 'Woodland123',
        },
        tls: {
          rejectUnauthorized: false,
        },
      });
      let email = [];
      playersData.map((item) => {
        email.push(item.email);
      });
      let user = [];
      playersData.map((item) => {
        user.push(item.username);
        user.push(item.money);
      });

      console.log(email);

      email.forEach(async function (to, i, array) {
        // send mail with defined transport object
        let info = await transporter.sendMail({
          from: 'games@aviabird.com', // sender address
          to: to, // list of receivers
          subject: "Result of today's game", // Subject line
          text: user.toString(), // plain text body
          html: user.toString(), // html body
        });
        console.log('Message sent: %s', info.messageId);
        // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

        // Preview only available when sending through an Ethereal account
        console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
        // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
      });
    }
    sendMail().catch(console.error);
  });

  socket.on('updateblinds', (data) => {
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );
    console.log(data);
    game.updateblind(data);
    console.log(game.smallBlind + game.bigBlind);
  })
  socket.on('disconnect', () => {
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );
    if (game != undefined) {
      const player = game.findPlayer(socket.id);
      game.finddisconnect = 'yes'
      if (player.username == game.host) {
        nonLiveGame(codeValue);
      }
      game.disconnectPlayer(player);
      if (game.players.length == 0) {
        if (this.rooms != undefined && this.rooms.length !== 0) {
          this.rooms = this.rooms.filter((a) => a != game);
        }
      }
    }
  });


  // socket.on('updateblinds',(ff)=>{
  //   aa(ff)
  // })
});
// const  aa=(data)=>{ 
//   return data
// }
function nonLiveGame(code) {
  var updateurl = `https://immense-dusk-54293.herokuapp.com/api/v1/livegame/${code}`;
  var xhr = new XMLHttpRequest();
  xhr.open('PUT', updateurl);
  xhr.setRequestHeader('Accept', 'application/json');
  xhr.setRequestHeader('Content-Type', 'application/json');

  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4) {
      console.log(xhr.status);
      console.log(xhr.responseText);
    }
  };
  data = {
    live: false
  }
  xhr.send(JSON.stringify(data));

};

io.on('connection', (socket) => {
  socket.on('chat message', (data) => {
    console.log(data);
    io.emit('chat message', data);
  })
})
server.listen(PORT, () => console.log(`hosting on port ${PORT}`));

