var _ = require('lodash');
var async = require('async');
var EventEmitter = require('events').EventEmitter;
var ffmpeg = require('fluent-ffmpeg');
var fs = require('fs');
var request = require('superagent');
var temp = require('temp');

var defaults = {
  client: 'chromium',
  clipSize: 15,
  lang: 'en-US',
  maxRequests: 4,
  maxResults: 1,
  pfilter: 1,
  sampleRate: 44000,
  timeout: 6000,
  xjerr: 1
};

module.exports = function (options, callback) {
  var opts = _.merge({}, defaults, options || {});
  var finishedReadingFile = false;

  var queue = async.priorityQueue(
    processClip,
    opts.maxRequests
  );

  queue.events = new EventEmitter();
  queue.results = [];

  var reader = new EventEmitter();

  reader.open = function (file) {
    var self = this;

    ffmpeg.ffprobe(file, function (err, info) {
      if (err) return self.emit('error', err);
      var fileSize = info.format.duration;
      var clipCount = Math.ceil(fileSize / opts.clipSize);
      var clips = _.range(clipCount);

      function readClip(i, done) {
        var output = temp.path({suffix: '.flac'});

        ffmpeg()
          .on('error', function (err) {
            self.emit('error', err);
            done(err);
          })
          .on('end', function () {
            self.emit('clip', output, i);
            done(null, output);
          })
          .input(file)
          .setStartTime(i * opts.clipSize)
          .duration(opts.clipSize)
          .output(output)
          .audioFrequency(opts.sampleRate)
          .toFormat('flac')
          .run();
      }

      function end() {
        self.emit('end');
      }

      async.map(clips, readClip, end);
    });
  };

  function processClip(clip, done) {
    transcribeClip(clip, function (err, result) {
      fs.unlink(clip);
      if (!err) return done(null, queue.results.push(result));
      queue.events.emit('error', err);
      done(err);
    });
  }

  function transcribeClip(clip, done) {
    fs.readFile(clip, function (err, data) {
      if (err) return done(err);

      request
        .post('https://www.google.com/speech-api/v2/recognize')
        .type('audio/x-flac; rate=' + opts.sampleRate)
        .parse(request.parse.text)
        .query({key: opts.key})
        .query({lang: opts.lang})
        .query({maxResults: opts.maxResults})
        .query({pfilter: opts.pfilter ? 1 : 0})
        .send(data)
        .timeout(opts.timeout)
        .end(function (err, res) {
          if (err) return done(err);
          var text = res.text;
          if (text) text = text.split('\n')[1];
          if (!text) return done(null, {result: []});
          try {
            done(null, JSON.parse(text));
          } catch (ex) {
            done(ex);
          }
        });
    });
  }

  reader.on('clip', function (clip, i) {
    queue.push(clip, i);
  });

  reader.on('end', function () {
    finishedReadingFile = true;
  });

  reader.on('error', function (err) {
    callback(err);
  });

  queue.drain = function () {
    if (!finishedReadingFile) return;
    callback(null, queue.results);
  };

  queue.events.on('error', function (err) {
    queue.kill();
    callback(err);
  });

  if (opts.file) {
    return reader.open(opts.file);
  }

  var file = temp.openSync().path;
  var writeStream = fs.createWriteStream(file);

  reader.on('end', function () {
    fs.unlink(file);
  });

  reader.on('error', function () {
    fs.unlink(file);
  });

  queue.events.on('error', function () {
    fs.unlink(file);
  });

  writeStream.on('end', function () {
    reader.open(file);
  });

  writeStream.on('close', function () {
    reader.open(file);
  });

  writeStream.on('error', function () {
    callback(err);
  });

  return writeStream;
};
