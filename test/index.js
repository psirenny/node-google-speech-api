var path = require('path')
  , should = require('chai').should()
  , speech = require('../index');

function check(text, done) {
  return function (err, res) {
    if (err) throw err;
    res.should.be.an('array');
    res[0].should.be.an('object');
    res[0].status.should.equal(0);
    res[0].hypotheses.should.be.an('array');
    res[0].hypotheses[0].should.be.an('object');
    res[0].hypotheses[0].utterance.should.equal(text);
    done();
  };
}

describe('speech', function () {
  var en = path.join(__dirname, 'fixtures/en.mp3')
    , es = path.join(__dirname, 'fixtures/es.mp3')
    , profanity = path.join(__dirname, 'fixtures/profanity.mp3');

  it('should be a function', function () {
    speech.should.be.a('function');
  });

  it('should take a string', function (done) {
    this.timeout(2000);
    speech(en, check('thank you very much', done));
  });

  it('should take an object', function (done) {
    this.timeout(2000);
    var opts = {file: en};
    speech(opts, check('thank you very much', done));
  });

  it('should work in another language', function (done) {
    this.timeout(2000);
    var opts = {file: es, lang: 'es'};
    speech(opts, check('muchas gracias', done));
  });

  it('should censor profanity', function (done) {
    this.timeout(3000);
    var opts = {file: profanity, pfilter: true};
    speech(opts, check('the f*** out my face with that s***', done));
  });

  it('should not censor profanity', function (done) {
    this.timeout(3000);
    var opts = {file: profanity, pfilter: false};
    speech(opts, check('the fuck out my face with that shit', done));
  });
});