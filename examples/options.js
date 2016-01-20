var reply = require('./../');

var surveyOver = function(){
  console.log("Thanks for your time.");
}

var options = {
  first_question: {
    message: 'What is 2 + 2 + 2 + 2 ? Five options.',
    options: [2,4,6,8,10]
  },
  second_question: {
    message: 'Well done! What is the 98 * 45',
    // regex: /4410/,
    depends_on: {
      first_question: 8,
    }
  },
  third_question: {
    message: 'Nice! What is 1000000000 * 1?',
    // regex: /1000000000/,
    depends_on: {
      second_question: 4410,
    }
  },
  you_win: {
    message: 'Perfect! Thank you for taking our survey. Was this your first time taking this survey?',
    depends_on: {
      third_question: 1000000000,
    }
  },
  try_again: {
    message: 'Game over. Do you want to start again?',
    type: 'boolean',
    default: true
  }
}

function startSurvey() {
  reply.get(options, function(err, result){
    if (err || !result.try_again)
      surveyOver();
    else
      startSurvey();
  })
}

console.log("Let's play a game shall we?");
startSurvey();