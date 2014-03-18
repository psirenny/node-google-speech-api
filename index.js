var _ = require('lodash')
  , async = require('async')
  , exec = require('child_process').exec
  , fs = require('fs')
  , path = require('path')
  , qs = require('qs')
  , request = require('request')
  , temp = require('temp')
  , util = require('util')

module.exports = function (options, callback) {
  var params = {
    client: 'chromium',
    lang: 'en-US',
    maxResults: 1,
    pfilter: 1,
    xjerr: 1
  };

  if (typeof options === 'string') {
    options = {file: options};
  }

  params = _.extend(params, _.pick.apply(this, [options].concat(_.keys(params))));
  params.pfilter = params.pfilter ? 1 : 0;

  options = _.defaults(options, params, {
    clipSize: 15,
    maxRequests: 4,
    sampleRate: 16000
  });

  var headers = {'content-type': 'audio/x-flac; rate=' + options.sampleRate}
    , url = 'https://www.google.com/speech-api/v1/recognize?' + qs.stringify(params);

  var getSpeech = function (file, callback) {
    fs.readFile(file, function (err, data) {
      if (err) return callback(err);

      request.post({body: data, headers: headers, url: url},
        function (err, res, body) {
          if (err) return callback(err);
          if (!!~body.toLowerCase().indexOf('html')) return callback(body);
          body = _(body.split('\n')).compact().join(',');

          try {
            callback(null, JSON.parse(body));
          }
          catch (e) {
            callback(e);
          }
          finally {
            fs.unlink(file);
          }
      });
    });
  };

  // get audio duration
  var cmd = util.format('sox --i -D "%s"', options.file);

  exec(cmd, function (err, duration) {
    if (err) return callback(err);

    // normalize audio
    var output = temp.path();
    cmd = util.format('sox "%s" -r %d "%s.flac" gain -n -5 silence 1 5 2%%', options.file, options.sampleRate, output);

    exec(cmd, function (err) {
      if (err) return callback(err);

      // split into 15 second sound clips
      cmd = util.format('sox "%s.flac" "%s%%1n.flac" trim 0 %d : newfile : restart', output, output, options.clipSize);

      exec(cmd, function (err) {
        fs.unlink(output + '.flac');
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
  });
};
