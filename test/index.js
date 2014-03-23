var _ = require('lodash')
  , concat = require('concat-stream')
  , natural = require('natural')
  , path = require('path')
  , should = require('chai').should()
  , speech = require('../index')
  , en = path.join(__dirname, 'fixtures/en.mp3')
  , es = path.join(__dirname, 'fixtures/es.mp3')
  , lengthy = path.join(__dirname, 'fixtures/lengthy.mp3')
  , profanity = path.join(__dirname, 'fixtures/profanity.mp3');

function combine(utterance, res) {
  var space = utterance ? ' ' : '';
  return utterance + space + res.hypotheses[0].utterance;
}

function check(opts, text, done) {
  var stream = speech(opts, function (err, res) {
    if (err) throw err;
    stream.pipe(concat(function (data) {
      res.should.deep.equal(JSON.parse(data));
      res.should.be.an('array');
      res[0].should.be.an('object');
      res[0].status.should.equal(0);
      res[0].hypotheses.should.be.an('array');
      res[0].hypotheses[0].should.be.an('object');
      var sentence = _.reduce(res, combine, '');
      var distance = natural.JaroWinklerDistance(sentence, text);
      distance.should.be.at.least(.8);
      done();
    }));
  });
}

describe('speech', function () {
  it('should be a function', function () {
    speech.should.be.a('function');
  });

  it('should take a string', function (done) {
    this.timeout(2000);
    check(en, 'thank you very much', done);
  });

  it('should take an object', function (done) {
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

  it('should clip long audio', function (done) {
    this.timeout(12000);
    var opts = {file: lengthy};
    check(opts, '1 of the Iliad of Homer rendered into English flag vs spy Edward Earl of Derby this is a liberal Vox recording recordings are in the public domain for more information or to volunteer please visit fox.org', done);
  });
});
