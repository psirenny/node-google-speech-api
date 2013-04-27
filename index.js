var _ = require('underscore')
  , _s = require('underscore.string')
  , async = require('async')
  , exec = require('child_process').exec
  , fs = require('fs')
  , path = require('path')
  , request = require('request');

module.exports = function (options, callback) {
  options = _.defaults(options, {
      client: 'chromium'
    , clipSize: 60
    , lang: 'en-US'
    , maxRequests: 4
    , maxResults: 1
    , sampleRate: 16000
  });

  var headers = {'content-type': 'audio/x-flac; rate=' + options.sampleRate}
    , base = 'https://www.google.com/speech-api/v1/recognize?client=%s&lang=%s&maxresults=%s'
    , url = _s.sprintf(base, options.client, options.lang, options.maxResults);

  var getSpeech = function (file, callback) {
    var stats = fs.statSync(file)
      , buf = new Buffer(stats.size);

    fs.open(file, 'r', function (status, fd) {
      fs.readSync(fd, buf, 0, stats.size, 0);

      request.post({body: buf, headers: headers, url: url},
        function (err, res, body) {
          if (err) return callback(err);

          try {
            callback(null, JSON.parse(body));
          }
          catch (err) {
            callback(err);
          }
          finally {
            fs.unlink(file);
          }
        });
    });
  };

  // get audio duration
  var cmd = _s.sprintf('sox --i -D %s', options.file);

  exec(cmd, function (err, duration) {
    if (err) return callback(err);

    // normalize audio, split into 60 second sound clips
    var output = _s.rtrim(options.file, path.extname(options.file))
      , base = 'sox "%s" -r %d "%s%%1n.flac" gain -n -5 silence 1 5 2%% trim 0 %d : newfile : restart'
      , cmd = _s.sprintf(base, options.file, options.sampleRate, output, options.clipSize);

    exec(cmd, function (err) {
      if (err) return callback(err);

      var files = []
        , count = Math.ceil(duration / options.clipSize);

      // push sound clip file names to array
      _.times(count, function (n) {
        files.push(output + (n + 1) + '.flac');
      });

      // get speech for each sound clip
      async.mapLimit(files, options.maxRequests, getSpeech, callback);
    });
  });
};