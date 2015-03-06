Google Speech API
=================

[![Build Status](https://travis-ci.org/psirenny/node-google-speech-api.png?branch=master)](https://travis-ci.org/psirenny/node-google-speech-api)

Google [Speech API](https://gist.github.com/alotaiba/1730160) wrapper for node.
It requires [FFmpeg](https://www.ffmpeg.org) compiled with flac support in order to work.

1.0.0 Update
------------

Switched from SoX to FFmpeg. Make sure you have at least version 0.9 of ffmpeg.

0.5 Update
----------

The google speech api now requires an **API Key**.
You'll have to create an app in the Google Developers Console and enable the speech api.  

To enable the speech api in the developer console you must join the **chromium dev-list** in google groups.
See [these comments](http://mikepultz.com/2013/07/google-speech-api-full-duplex-php-version/#comments) for more details.  

The response format has also changed.
Instead of returning *utterances*, google now returns alternatives with a *transcript*.
See the example below.

Usage
-----

See 'example' folder for a fully functional example. (rename '_keys.txt' to 'keys.txt' and insert your Google API Key)

```javascript
var speech = require('google-speech-api');

var opts = {
  file: 'speech.mp3',
  key: '<Google API Key>'
};

speech(opts, function (err, results) {
  console.log(results);
  // [{result: [{alternative: [{transcript: '...'}]}]}]
});
```

Piping
------

You can pipe data:

```javascript
    var request = require('superagent');
    var speech = require('google-speech-api');

    // must specify the filetype when piping
    var opts = {filetype: 'mp3'};

    request
      .get('http://../../file.mp3')
      .pipe(speech(opts, function (err, results) {
        // handle the results
      }));
```

Options
-------

You can specify several options:
* clipSize — The audio duration of files sent to google (in seconds.) Larger files will be broken into pieces. (defaults to 15)
* ***file*** — The audio file. May be a `string` path or a `Buffer` object. (required)
* ***key*** — Your google API key. (required)
* client — The name of the client you are connecting with. (defaults to "chromium")
* filetype — Specify the file type. Required when piping or if the file is a buffer object.
* lang — The spoken language in the file. (defaults to "en-US")
* maxRequests — The maximum number of clips to send to google at a time. (defaults to 4)
* maxResults — The maximum number of hypotheses returned by google. (defaults to 1)
* pfilter — Filter profanity by replacing flagged words with pound symbols. Set 0 to unfilter. (defaults to 1)
* sampleRate — The sample rate of the audio sent to google. (defaults to 16000)
* xjerr — Return errors as part of the JSON response if set to 1, otherwise returns errors as HTTP error codes. (defaults to 1)
