var _ = require('lodash')
  , async = require('async')
  , fs = require('fs')
  , format = require('google-speech-format')
  , qs = require('qs')
  , request = require('request');

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

  format(options, function (err, files) {
    if (err) return callback(err);
    async.mapLimit(files, options.maxRequests, getSpeech, callback);
  });
};