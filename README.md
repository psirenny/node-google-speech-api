Google Speech API
=================

Google [Speech API](https://gist.github.com/alotaiba/1730160) wrapper for node.
It requires [SoX](http://sox.sourceforge.net) compiled with flac support in order to work.

Usage
-----

```javascript
var speech = require('google-speech-api');

speech({file: '/path/to/audio/file'}, function (err, results) {
  console.log(results);
  // [{status: 0, id: '...', hypotheses: [{utterance: 'this is a test', confidence: 0.9162679}]}]}]
});
```

Options
-------

You can specify several options:
* client — The name of the client you are connecting with. (defaults to "chromium")
* lang — The spoken language in the file. (defaults to "en-US")
* maxResults — The maximum number of hypotheses returned by google. (defaults to 1)
* clipSize — The audio duration of files sent to google (in seconds.) Larger files will be broken into pieces. (defaults to 60)
* maxRequests — The maximum number of clips to send to google at a time. (defaults to 4)
* sampleRate — The sample rate of the audio sent to google.

i.e.

```javascript
var options = {
    file: '/wavs/arnold.wav'
  , lang: 'en-US'
  , clipSize: 45
  , maxRequests: 20
}

speech(options, function (err, results) {
  if (err) return console.error(err);
  console.log(results);
});
```
