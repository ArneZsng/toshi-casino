const Bot = require('./lib/Bot')
const SOFA = require('sofa-js')
const Fiat = require('./lib/Fiat')
const unit = require('./lib/unit')
const FigureSymbols = [`🍐`, `🍌`, `🍉`, `🔔`, `🍋`, `🍓`, `🏆`, `7️⃣`, `🍒`, `🌞`]

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
      console.log(message)
      var figures = [randomDigit(), randomDigit(), randomDigit()]
      session.set(message.txHash, figures)
      sendMessage(session, `Let the games begin! 🎲`)
      sendMessage(session, `❔❔❔`)
      sendMessage(session, FigureSymbols[figures[0]] + `❔❔`)
      sendMessage(session, FigureSymbols[figures[0]] + FigureSymbols[figures[1]] + `❔`)
      sendMessage(session, FigureSymbols[figures[0]] + FigureSymbols[figures[1]] + FigureSymbols[figures[2]])
      generateResults(session, figures)
    } else if (message.status == 'confirmed') {
      // handle when the payment is actually confirmed!
      var figures = session.get(message.txHash)
      generatePayout(session, message, figures)
    } else if (message.status == 'error') {
      sendMessage(session, `There was an error with your payment! 🚫`)
    }
  }
}

// STATES

function welcome(session) {
  sendMessage(session, `Welcome to the Toshi Casino. With a little luck, you can turn the money you send to me into a fortune. Just push Play.`)
}

function play(session) {
  let credit = session.get('credit') || 0
  let amount = 1
  if (credit < 2) {
    sendMessage(session, `You are new to Toshi Casino. This round is on the house! Here is $1 for you. 💵`)
    session.set('credit', credit + amount)
    Fiat.fetch().then((toEth) => {
      session.sendEth(toEth.USD(amount))
    })
    sendMessage(session, `Get ready. The money you send to me will be your stake.`)
    Fiat.fetch().then((toEth) => {
      session.requestEth(toEth.USD(amount))
    })
  } else {
    sendMessage(session, `Get ready. The money you send to me will be your stake. For a different amount, just use the 'Pay' feature in the top right.`)
    Fiat.fetch().then((toEth) => {
      session.requestEth(toEth.USD(amount))
    })
  }

}

// BUSINESS LOGIC

function twoMatchesResult(session, figure) {
  sendMessage(session, `Oh wow, you got 2 ` + FigureSymbols[figure] + `'s. Payday! 💸`)
}

function threeMatchesResult(session, figure) {
  sendMessage(session, `Amazing, you got 3 ` + FigureSymbols[figure] + `'s. Jackpot! 💰💰💰`)
}

function generateResults(session, figures) {
  if (figures[0] == figures[1] && figures[1] == figures[2]) {
    threeMatchesResult(session, figures[0])
  } else if (figures[0] == figures[1] || figures[0] == figures[2]) {
    twoMatchesResult(session, figures[0])
  } else if (figures[1] == figures[2]) {
    twoMatchesResult(session, figures[1])
  } else {
    sendMessage(session, `Hmm, unfortunately no match. Better luck next time! 🍀`)
  }
}

function twoMatchesPayout(session, message, figure) {
  session.sendEth(unit.fromWei(message.value, 'ether') * (2 + (figure/10)))
}

function threeMatchesPayout(session, message, figure) {
  session.sendEth(unit.fromWei(message.value, 'ether') * (50 + figure))
}

function generatePayout(session, message, figures) {
  if (figures[0] == figures[1] && figures[1] == figures[2]) {
    threeMatchesPayout(session, message, figures[0])
  } else if (figures[0] == figures[1] || figures[0] == figures[2]) {
    twoMatchesPayout(session, message, figures[0])
  } else if (figures[1] == figures[2]) {
    twoMatchesPayout(session, message, figures[1])
  }
}

// HELPERS

function sendMessage(session, message) {
  let controls = [
    {type: 'button', label: 'Play 🕹', value: 'play'}
  ]
  session.reply(SOFA.Message({
    body: message,
    controls: controls,
    showKeyboard: false,
  }))
}

function randomDigit() {
  return Math.floor(Math.random() * 10)
}
