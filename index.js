var _ = require('lodash');
var async = require('async');
var concat = require('concat-stream');
var duplexer = require('duplexer');
var fs = require('fs');
var format = require('google-speech-format');
var qs = require('qs');
var request = require('request');
var through = require('through');

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

  // create a readable stream that fetches speech
  // from the google speech api when it is closed
  var readStream = through(null, function () {
    this.queue(null);
    start();
  });

  // create a writeable stream that receives audio data,
  // concatenates all of it and then closes the read stream
  var writeStream = concat(function (data) {
    options.file = data;
    read.end();
  });

  var headers = {'content-type': 'audio/x-flac; rate=' + options.sampleRate};
  var url = 'https://www.google.com/speech-api/v2/recognize?' + qs.stringify(params);
  var stream = duplexer(writeStream, readStream);
  stream.pause();

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
  }

  function end(err, res) {
    callback(err, res);
    stream.resume().queue(JSON.stringify(res)).end();
  }

  function start() {
    format(options, function (err, files) {
      if (err) return callback(err);
      async.mapLimit(files, options.maxRequests, getSpeech, end);
    });
  }

  // call the api if a file is provided
  if (options.file) start();

  // otherwise, wait for data to be piped to the write stream
  return stream;
};
