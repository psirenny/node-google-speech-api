var _ = require('lodash');
var concat = require('concat-stream');
var natural = require('natural');
var path = require('path');
var should = require('chai').should();
var speech = require('../index');
var en = path.join(__dirname, 'fixtures/en.mp3');
var es = path.join(__dirname, 'fixtures/es.mp3');
var lengthy = path.join(__dirname, 'fixtures/lengthy.mp3');
var profanity = path.join(__dirname, 'fixtures/profanity.mp3');

function combine(utterance, res) {
  var space = utterance ? ' ' : '';
  if (!res.result[0]) return utterance;
  return utterance + space + res.result[0].alternative[0].transcript;
}

function check(opts, text, done) {
  opts.accuracy = opts.accuracy || 0.8;
  opts.key = process.env.GOOGLE_API_KEY;
  var stream = speech(opts, function (err, results) {
    if (err) throw err;
    stream.pipe(concat(function (data) {
      results.should.deep.equal(JSON.parse(data));
      results.should.be.an('array');
      results[0].should.be.an('object');
      results[0].result.should.an('array');
      var sentence = _.reduce(results, combine, '');
      var distance = natural.JaroWinklerDistance(sentence, text);
      distance.should.be.at.least(opts.accuracy);
      done();
    }));
  });
}

describe('google speech api', function () {
  it('should be a function', function () {
    speech.should.be.a('function');
  });

  it('should transcribe', function (done) {
    this.timeout(2000);
    var opts = {file: en};
    check(opts, 'thank you very much', done);
  });

  it('should work in another language', function (done) {
    this.timeout(2000);
    var opts = {file: es, lang: 'es'};
    check(opts, 'muchas gracias', done);
  });

  it('should censor profanity', function (done) {
    this.timeout(3000);
    var opts = {file: profanity, pfilter: true};
    check(opts, 'f*** you', done);
  });

  it('should not censor profanity', function (done) {
    this.timeout(3000);
    var opts = {file: profanity, pfilter: false};
    check(opts, 'fuck you', done);
  });

  it.skip('should clip long audio', function (done) {
    this.timeout(12000);
    var opts = {accuracy: 0.3, file: lengthy};
    check(opts, '1 of the Iliad of Homer rendered into English flag vs spy Edward Earl of Derby this is a liberal Vox recording recordings are in the public domain for more information or to volunteer please visit fox.org', done);
  });
});
