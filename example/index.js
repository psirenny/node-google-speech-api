if (!process.argv[2]) return console.error('Error. The audio filepath should be the first argument.');

var speech = require('../index');
var fs = require('fs');

fs.readFile('key.txt', {encoding: 'utf8'}, function(err, key) {
	if (err) return console.error('Error. Could not find or read key at "key.txt" file.');

	var opts = {
	  file: process.argv[2],
	  key: key,
	  pfilter: 0,
	  lang: process.argv[3] ? process.argv[3] : 'en'
	};

	speech(opts, function (err, results) {
	  if (err) return console.error('Error. The filepath or API key is probably invalid.');

	  console.log(results[0].result[0].alternative[0].transcript);
	});
});