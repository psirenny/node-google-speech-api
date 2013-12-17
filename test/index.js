var path = require('path')
  , should = require('chai').should()
  , speech = require('../index');

describe('speech', function () {
  it('should be a function', function () {
    speech.should.be.a('function');
  });
});