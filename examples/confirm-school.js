var reply = require('./../');

reply.confirm('Do you go to the University of Washington', function(err, yes){

  if (!err && yes)
    console.log("GO HUSKIES!!");
  else
    console.log("Awww darn.. as long you are not a Cougar");

});
