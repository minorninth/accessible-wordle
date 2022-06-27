#!/bin/bash
set -v
rm -f wordle-compact.js wordle.min.js wordle.bookmarklet.js
cat wordle-script.js | grep -v console.log | grep -v // | grep -v strict > wordle-compact.js
curl -X POST -s --data-urlencode 'input@wordle-compact.js' https://www.toptal.com/developers/javascript-minifier/api/raw > wordle.min.js
echo -n "javascript:" | cat - wordle.min.js | sed 's/ /%20/g' > wordle.bookmarklet.js

