var _ = require('lodash')
  , async = require('async')
  , fs = require('fs')
  , format = require('google-speech-format')
  , qs = require('qs')
  , request = require('request')
  , through = require('through');

module.exports = function (options, callback) {
  var params = {
    app: '',
    client: 'chromium',
    key: '',
    lang: 'en-US',
    maxResults: 1,
    output: 'json',
    pfilter: 1,
    xjerr: 1
  };

  params = _.extend(params, _.pick.apply(this, [options].concat(_.keys(params))));
  params.pfilter = params.pfilter ? 1 : 0;

  options = _.defaults(options, params, {
    clipSize: 15,
    maxRequests: 4,
    sampleRate: 16000
  });

  var headers = {'content-type': 'audio/x-flac; rate=' + options.sampleRate}
    , stream = through().pause()
    , url = 'https://www.google.com/speech-api/v2/recognize?' + qs.stringify(params);

  function getSpeech(file, callback) {
    fs.readFile(file, function (err, data) {
      if (err) return callback(err);

      request.post({body: data, headers: headers, url: url},
        function (err, res, body) {
          if (err) return callback(err);
          if (/<!DOCTYPE html>/i.test(body)) return callback(body);
          body = _.last(body.split('\n'), 2)[0];

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

  function onEnd(err, res) {
    callback(err, res);
    stream.resume().queue(JSON.stringify(res)).end();
  }

  format(options, function (err, files) {
    if (err) return callback(err);
    async.mapLimit(files, options.maxRequests, getSpeech, onEnd);
  });

  return stream;
};
