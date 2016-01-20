var rl, readline = require('readline');

var get_interface = function(stdin, stdout) {
  if (!rl) rl = readline.createInterface(stdin, stdout);
  else stdin.resume(); // interface exists
  return rl;
}

/**
  * Confirms the response given by the user. Has a default response in case of blank input.
  * @param {String} message: message given to prompt a response. 
  * @param {function} callback(err, answer): confirms if the input is the correct answer expected.
  */
var confirm = exports.confirm = function(message, callback) {

  var question = { // sets an expected and default answer to the message
    'reply': {
      type: 'confirm',
      message: message,
      default: 'yes'
    }
  }

  get(question, function(err, answer) {
    if (err) return callback(err); // gives error message if the answer is not expected or wrong
    callback(null, answer.reply === true || answer.reply == 'yes');
  });

};

/**
  * Gets the variety of options that the input can lead to and acceptable answers to the passed options. 
  * @param {Array} options: set of options that the user is expected to give.
  * @param {function} callback(err, result): gets the values of the chosen option. 
  */
var get = exports.get = function(options, callback) {

  if (!callback) return; // no point in continuing

  if (typeof options != 'object')
    return callback(new Error("Please pass a valid options object."))

  /**
    * Set recorded and saved answers inputted by user.
    */
  var answers = {},
      stdin = process.stdin,
      stdout = process.stdout,
      fields = Object.keys(options);

  /**
    * Closes the overall prompts and input.
    */
  var done = function() {
    close_prompt();
    callback(null, answers);
  }

  /**
    * Closes the prompted message.
    */
  var close_prompt = function() {
    stdin.pause();
    if (!rl) return; // stops prompt if readline is non existant 
    rl.close();
    rl = null;
  }

  /**
    * Gets the default value of the passed object.
    * @param {Object} key: retrieves the type of object within the array.
    * @param {Object} partial answers: gets the default partial answers to display for answers that don't fully meet the needs of an option. 
    * @return passed object and value from the options.
    */
  var get_default = function(key, partial_answers) {
    if (typeof options[key] == 'object')
      return typeof options[key].default == 'function' ? options[key].default(partial_answers) : options[key].default;
    else
      return options[key];
  }

  /**
    * Assumes the user's input and matches it to a value based on the contents of the string.
    * @param {String} reply: user's answer to the message.
    * @return assumed value of the user's answer.
    */
  var guess_type = function(reply) {

    if (reply.trim() == '') // blank response, leading to default value 
      return;
    else if (reply.match(/^(true|y(es)?)$/)) // guesses if input has string relating to a yes/true
      return true;
    else if (reply.match(/^(false|n(o)?)$/)) // guesses if input has string relating to a no/false
      return false;
    else if ((reply*1).toString() === reply) // guesses if input is a number 
      return reply*1;

    return reply;
  }

  /**
    * Tests if the passed answer is equal to either the regex or object value from the options.
    * @param {Object} key: value of the key from the chosen option.
    * @param {Object} answer: answer from chosen object from options.
    */
  var validate = function(key, answer) {

    if (typeof answer == 'undefined')
      return options[key].allow_empty || typeof get_default(key) != 'undefined';
    else if(regex = options[key].regex)
      return regex.test(answer);
    else if(options[key].options)
      return options[key].options.indexOf(answer) != -1;
    else if(options[key].type == 'confirm')
      return typeof(answer) == 'boolean'; // answer was given so it should be
    else if(options[key].type && options[key].type != 'password')
      return typeof(answer) == options[key].type;

    return true;

  }

  /**
    * Displays the error message of the passed key's value.
    * @param {Object} key: value of the key from the chosen option.
    */
  var show_error = function(key) {
    var str = options[key].error ? options[key].error : 'Invalid value.';

    if (options[key].options)
        str += ' (options are ' + options[key].options.join(', ') + ')';

    stdout.write("0x33[31m" + str + "0x33[0m" + "\n");
  }

  /**
    * Displays the message of the passed key's value.
    * @param {Object} key: value of the key from the chosen option.
    */
  var show_message = function(key) {
    var msg = '';

    if (text = options[key].message)
      msg += text.trim() + ' ';

    if (options[key].options) // displays options
      msg += '(options are ' + options[key].options.join(', ') + ')';

    if (msg != '') stdout.write("0x33[1m" + msg + "0x33[0m\n");
  }

  /**
    * Waits for user's input and masks the input as asterisks.
    * @param {String} prompt: displayed message asking for password.
    * @param {function} callback(err, answer): takes in the input and checks if password matches.
    */
  // taken from commander lib
  var wait_for_password = function(prompt, callback) {

    var buf = '',
        mask = '*';

    /**
      * Allows the user to backspace on their password input without breaking.
      * @param {String} c: action typed c to close prompt when needed.
      * @param {String} key: character entered in by the user.
      */
    var keypress_callback = function(c, key) {

      if (key && (key.name == 'enter' || key.name == 'return')) {
        stdout.write("\n");
        stdin.removeAllListeners('keypress');
        // stdin.setRawMode(false);
        return callback(buf);
      }

      if (key && key.ctrl && key.name == 'c') // closes the prompt if the user cancels the prompt
        close_prompt();

      if (key && key.name == 'backspace') { // allows backspacing for password
        buf = buf.substr(0, buf.length-1);
        var masked = '';
        for (i = 0; i < buf.length; i++) { masked += mask; }
        stdout.write('\r0x33[2K' + prompt + masked);
      } else {
        stdout.write(mask);
        buf += c;
      }

    };

    stdin.on('keypress', keypress_callback);
  }

  /**
    * Checks the input to see if it can go onto the next prompt.
    * @param {int} index: scan through the array of questions to prompt the user with.
    * @param {Object} current key: current object of the indexed option from the array.
    * @param {Object} fallback: answer to rely on if reply doesn't meet needs.
    * @param {String} reply: user's inputted response .
    */
  var check_reply = function(index, curr_key, fallback, reply) {
    var answer = guess_type(reply);
    var return_answer = (typeof answer != 'undefined') ? answer : fallback;

    if (validate(curr_key, answer))
      next_question(++index, curr_key, return_answer);
    else
      show_error(curr_key) || next_question(index); // repeats current
  }

  /**
    * Checks if the conditions have been met.
    * @param {Object} conditions: answer meets the contraints of the key's values.
    */
  var dependencies_met = function(conds) {
    for (var key in conds) {
      var cond = conds[key];
      if (cond.not) { // object, inverse
        if (answers[key] === cond.not)
          return false;
      } else if (cond.in) { // array 
        if (cond.in.indexOf(answers[key]) == -1) 
          return false;
      } else {
        if (answers[key] !== cond)
          return false; 
      }
    }

    return true;
  }

  /**
    * Gets the next indexed question in the array of options.
    * @param {Object} index: position of the current question in the array.
    * @param {Object} previous key: the last question asked through the index.
    * @param {Object} answer: value of the inputted answer.
    */
  var next_question = function(index, prev_key, answer) {
    if (prev_key) answers[prev_key] = answer; // sets last key to the current answer

    var curr_key = fields[index]; //keeps track of current question
    if (!curr_key) return done();

    if (options[curr_key].depends_on) {
      if (!dependencies_met(options[curr_key].depends_on)) // checks if a question's fallback response meets conditions
        return next_question(++index, curr_key, undefined);
    }

    var prompt = (options[curr_key].type == 'confirm') ?
      ' - yes/no: ' : " - " + curr_key + ": ";

    var fallback = get_default(curr_key, answers);
    if (typeof(fallback) != 'undefined' && fallback !== '') // displays the fallback prompt if the question of the current key is invalid
      prompt += "[" + fallback + "] ";

    show_message(curr_key); 

    if (options[curr_key].type == 'password') { // checks if current object is a password

      var listener = stdin._events.keypress; // to reassign down later
      stdin.removeAllListeners('keypress');

      // stdin.setRawMode(true);
      stdout.write(prompt);

      wait_for_password(prompt, function(reply) {
        stdin._events.keypress = listener; // reassign
        check_reply(index, curr_key, fallback, reply)
      });

    } else {

      rl.question(prompt, function(reply) { // if it isn't a password, check the inputted reply
        check_reply(index, curr_key, fallback, reply);
      });

    }

  }

  rl = get_interface(stdin, stdout);
  next_question(0);

  rl.on('close', function() {
    close_prompt(); // just in case

    var given_answers = Object.keys(answers).length;
    if (fields.length == given_answers) return;

    var err = new Error("Cancelled after giving " + given_answers + " answers.");
    callback(err, answers);
  });

}
