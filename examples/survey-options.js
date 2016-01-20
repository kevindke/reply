var fs = require('fs');
var reply = require('./..');
var options = JSON.parse(fs.readFileSync(__dirname + '/survey-options.json').toString());

reply.confirm('Would you like to take a survey for science purposes?', function(err, yes){

	if (!err && yes) {
	    console.log("Please answer the following questions:");
	} else {
	    return console.log("We are sorry to hear that. Thank you.");
	}

	reply.get(options, function(err, answers){
	  console.log('\n ==== Answers: ====\n');
	  if (err) {
	  	console.log(err);
	  } else {
	  	console.log(answers);
	  }
	});
});