// server-side socket.io backend event handling
const express = require('express');
const http = require('http');
const socketio = require('socket.io');
// const url=require('url')
const Game = require('./classes/game.js');
const path=require('path')
const app = express();
const nodemailer = require("nodemailer");
// const ls = require('local-storage');
// var localStorages = require('localStorage')
// localStorages.setItem('myKey', 'sdfvb');
// const localStorages=require('localStorage')
// app.use(express.static(__dirname+'/client/css'))
// if()
// var url_string =location.href
// var url = new URL(url_string);
// var codeValue = url.searchParams.get("token");
app.get(`/playgame` , (req , res)=>{
   res.sendFile(path.join(__dirname+'/client/index.html'))
})
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

app.use('/', express.static(__dirname + '/client'));

let rooms = [];

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
      // localStorage.setItem('myFirstKey', code);
      // ls.set('foo','data.username')
      const game = new Game(code, data.username);

      // if (typeof localStorage === "undefined" || localStorage === null) {
      //   var LocalStorage = require('node-localstorage').LocalStorage;
      //   localStorage = new LocalStorage('./scratch');
      // }
      // localStorage.setItem('myFirstKey', data.username);
      // ls.set('foo','data.username')
      // global.localStorage.setItem('asd','sdfg')
      rooms.push(game);
      game.addPlayer(data.username,data.email, socket);
      game.emitPlayers('hostRoom', {
        code: code,
        players: game.getPlayersArray(),
      });
    }
  });

  socket.on('join', (data) => {
    const game = rooms.find((r) => r.getCode() === data.code);
    if (
      game == undefined ||
      game.getPlayersArray().some((p) => p == data.username) ||
      data.username == undefined ||
      data.username.length > 12
    ) {
      socket.emit('joinRoom', undefined);
    } else {
      game.addPlayer(data.username,data.email, socket);
      rooms = rooms.map((r) => (r.getCode() === data.code ? game : r));
      game.emitPlayers('joinRoom', {
        host: game.getHostName(),
        players: game.getPlayersArray(),
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
      var timmer=30
      socket.emit('timmer',timmer)
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

  // socket.on('timer_turn', (data) => {
  //   console.log("timer"+data);
  //   data.map((item)=>{
  //     if(item.status == "Their Turn"){
  //       var timeleft = 20;
  //                 var downloadTimer = setInterval(function()
  //                 {
  //                   if(timeleft <= 0){ 
  //                   clearInterval(downloadTimer); 
  //                        document.getElementById("countdown").innerHTML = "Finished";
  //                  } else { 
  //                       document.getElementById("countdown").innerHTML = timeleft + " seconds remaining"; 
  //                  } 
  //                   timeleft -= 1; 
  //                   }, 1000);
  //              } 
      
  //   })
  // })
  // precondition: user must be able to make the move in the first place.
  socket.on('moveMade', (data) => {
    // worst case complexity O(num_rooms * num_players_in_room)
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );

    if (game != undefined) {

      socket.broadcast.emit('ring', data.move)

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

  socket.on('result', () => {
    let playersData = [];
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );
    for (let pn = 0; pn < game.getNumPlayers(); pn++) {
      playersData.push({
        username: game.players[pn].getUsername(),
        money: game.players[pn].getMoney(),
        buyIns: game.players[pn].buyIns,
        email: game.players[pn].getEmail()
      });
    }
    //console.log(playersData);
    socket.emit('getresult', playersData);

    async function sendMail() {
      // Generate test SMTP service account from ethereal.email
      // Only needed if you don't have a real mail account for testing
      let testAccount = await nodemailer.createTestAccount();
    
      // create reusable transporter object using the default SMTP transport
      const transporter = nodemailer.createTransport({
        host: "smtp-mail.outlook.com", // hostname
        secureConnection: false, // TLS requires secureConnection to be false
        port: 587, // port for secure SMTP
        tls: {
          ciphers:'SSLv3'
        },
        auth: {
            user: 'games@aviabird.com',
            pass: 'Woodland123',
        }
    });

    let email=[];
    playersData.map(item => {
      email.push(item.email);
    } );
    let user=[];
    playersData.map(item => {
      user.push(item.username);
      user.push(item.money);
    } );
    
    console.log(email);
    
    email.forEach(async function (to, i , array) {
      // send mail with defined transport object
      let info = await transporter.sendMail({
        from: 'gamesaviabird@gmail.com', // sender address
        to: to, // list of receivers
        subject: "Result of today's game", // Subject line
        text: user.toString(), // plain text body
        html: user.toString(), // html body
      });
      console.log("Message sent: %s", info.messageId);
      // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>
    
      // Preview only available when sending through an Ethereal account
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
      // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
    });
      
      
    
      
    }
    sendMail().catch(console.error);
  });
 socket.on('timer_turn', (data) => {
//   // console.log("timer",data);
const yy=30
//   data.map((item)=>{
//     if(item.status == "Their Turn"){
      socket.emit('turn_data',data)
      // socket.emit('timmer',yy)
//     }
// })
 })

  socket.on('disconnect', () => {
    const game = rooms.find(
      (r) => r.findPlayer(socket.id).socket.id === socket.id
    );
    if (game != undefined) {
      const player = game.findPlayer(socket.id);
      game.disconnectPlayer(player);
      if (game.players.length == 0) {
        if (this.rooms != undefined && this.rooms.length !== 0) {
          this.rooms = this.rooms.filter((a) => a != game);
        }
      }
    }
  });
});

server.listen(PORT, () => console.log(`hosting on port ${PORT}`)); 