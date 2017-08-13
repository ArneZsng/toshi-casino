const Bot = require('./lib/Bot');
const SOFA = require('sofa-js');
const Fiat = require('./lib/Fiat');
const FigureSymbols = [`🤡`, `💩`, `👻`, `🔔`, `🍋`, `🍒`, `🏆`, `7️⃣`, `💀`, `🌞`];

let bot = new Bot()

// ROUTING

bot.onEvent = function(session, message) {
  switch (message.type) {
    case 'Init':
      welcome(session)
      break
    case 'Message':
      onMessage(session, message)
      break
    case 'Command':
      onCommand(session, message)
      break
    case 'Payment':
      onPayment(session, message)
      break
    case 'PaymentRequest':
      welcome(session)
      break
  }
}

function onMessage(session, message) {
  welcome(session)
}

function onCommand(session, command) {
  switch (command.content.value) {
    case 'play':
      play(session)
      break
    }
}

function onPayment(session, message) {
  if (message.fromAddress == session.config.paymentAddress) {
    // handle payments sent by the bot
    if (message.status == 'confirmed') {
      // perform special action once the payment has been confirmed
      // on the network
    } else if (message.status == 'error') {
      // oops, something went wrong with a payment we tried to send!
    }
  } else {
    // handle payments sent to the bot
    if (message.status == 'unconfirmed') {
      // payment has been sent to the ethereum network, but is not yet confirmed
      sendMessage(session, `Let the games begin! 🎲`);
      sendMessage(session, `❔❔❔`);
    } else if (message.status == 'confirmed') {
      // handle when the payment is actually confirmed!
      var figures = [randomDigit(), randomDigit(), randomDigit()];
      console.log('test');
      console.log(randomDigit());
      console.log(figures);
      sendMessage(session, FigureSymbols[figures[0]] + `❔❔`);
      setTimeout(function() {
        sendMessage(session, FigureSymbols[figures[0]] + FigureSymbols[figures[1]] + `❔`);
        setTimeout(function() {
          sendMessage(session, FigureSymbols[figures[0]] + FigureSymbols[figures[1]] + FigureSymbols[figures[2]] + ``);
          generateResults(session, message, figures);
        }, 2000);
      }, 2000);
    } else if (message.status == 'error') {
      sendMessage(session, `There was an error with your payment! 🚫`);
    }
  }
}

// STATES

function welcome(session) {
  sendMessage(session, `Welcome to the Toshi Casino. Let me know when you are ready to play.`)
}

function play(session) {
  Fiat.fetch().then((toEth) => {
    session.requestEth(toEth.USD(1));
  });
}

// BUSINESS LOGIC

function twoMatches(session, message, figure) {
  sendMessage(session, `Payday! 💸`);
  session.sendEth(message.value * (2 + (figure/10)));
}

function threeMatches(session, message, figure) {
  sendMessage(session, `Jackpot! 💰💰💰`);
  session.sendEth(message.value * (100 + (10 * figure)));
}

function generateResults(session, message, figures) {
  if (figures[0] == figures[1] && figures[1] == figures[2]) {
    threeMatches(session, message, figures[0]);
  } else if (figures[0] == figures[1] || figures[0] == figures[2]) {
    twoMatches(session, message, figures[0]);
  } else if (figures[1] == figures[2]) {
    twoMatches(session, message, figures[1]);
  } else {
    sendMessage(session, `Better luck next time! 🍀`);
  }
}

// example of how to store state on each user
// function count(session) {
//   let count = (session.get('count') || 0) + 1
//   session.set('count', count)
//   sendMessage(session, `${count}`)
// }

// HELPERS

function sendMessage(session, message) {
  let controls = [
    {type: 'button', label: 'Play', value: 'play'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

function randomDigit() {
  return Math.floor(Math.random() * 10);
}
