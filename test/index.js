var _ = require('lodash');
var fs = require('fs');
var lib = require('../index');
var natural = require('natural');
var path = require('path');
var test = require('tape');
var fixtures = {};
fixtures.en = path.join(__dirname, 'fixtures/en.mp3');
fixtures.es = path.join(__dirname, 'fixtures/es.mp3');
fixtures.lengthy = path.join(__dirname, 'fixtures/lengthy.mp3');
fixtures.profanity = path.join(__dirname, 'fixtures/profanity.mp3');

function combine(utterance, res) {
  var space = utterance ? ' ' : '';
  if (!res.result[0]) return utterance;
  return utterance + space + res.result[0].alternative[0].transcript;
}

function check(t, opts, text) {
  var file = fs.createReadStream(opts.file);
  opts.accuracy = opts.accuracy || 0.8;
  opts.key = process.env.GOOGLE_API_KEY;

  function test(err, results) {
    t.error(err);
    t.equal(typeof results, 'object');
    t.equal(typeof results[0], 'object');
    t.equal(typeof results[0].result, 'object');
    var sentence = _.reduce(results, combine, '');
    var distance = natural.JaroWinklerDistance(sentence, text);
    t.equal(distance >= opts.accuracy, true);
  };

  lib(opts, test);
  file.pipe(lib(_.omit(opts, 'file'), test));
}

test('it should be a function', function (t) {
  t.plan(1);
  t.equal(typeof lib, 'function');
});

test('it should transcribe', function (t) {
  var opts = {file: fixtures.en};
  t.plan(10);
  check(t, opts, 'thank you very much');
});

test('should work in another language', function (t) {
  var opts = {file: fixtures.es, lang: 'es'};
  t.plan(10);
  check(t, opts, 'muchas gracias');
});

test('should censor profanity', function (t) {
  var opts = {file: fixtures.profanity, pfilter: true};
  t.plan(10);
  check(t, opts, 'f*** you');
});

test('should not censor profanity', function (t) {
  var opts = {file: fixtures.profanity, pfilter: false};
  t.plan(10);
  check(t, opts, 'fuck you');
});

test.skip('should clip long audio', function (t) {
  var opts = {accuracy: 0.3, file: fixtures.lengthy};
  t.plan(10);
  check(t, opts, '1 of the Iliad of Homer rendered into English flag vs spy Edward Earl of Derby this is a liberal Vox recording recordings are in the public domain for more information or to volunteer please visit fox.org');
});
