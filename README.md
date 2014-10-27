NOTE: THIS PROJECT IS DEPRECATED
================================

This project is no longer being maintained, and it is strongly recommended
that you not use it. While the idea of a node.js client that speaks in Heka's
"native" language is not without merit, there are many ways to get data into
Heka (log files, statsd client, feeding directly into a UDP/TCP socket, etc.),
and the Heka team doesn't have the resources to maintain a standalone Node
client at our desired quality / performance level.

If you're interested in feeding data from custom node.js software into a Heka
server and you need help figuring out the best way to do so, please ask for
assistance on the Heka mailing list (https://mail.mozilla.org/listinfo/heka)
or on the #heka channel on irc.mozilla.org and we'll be happy to assist.

[![Build Status](https://secure.travis-ci.org/mozilla-services/heka-node.png)](http://travis-ci.org/mozilla-services/heka-node)

A javascript library for generating and sending metrics logging to a heka listener.

To run the test suite use:

    $ npm test

You should see all tests pass with something that looks like this ::

    > heka@0.2.0 test /Users/victorng/dev/heka-node
    > jasmine-node tests

    ..........................................

    Finished in 0.713 seconds
    42 tests, 247 assertions, 0 failures


You can find a working HTTP echo server in the example directory.
Just run make, and it will install heka from npm and start a webserver
that emits heka messages for you.

    $ cd example 
    $ npm install
    ... lots of output installing packages ...
    $ node demo.js
    myapp listening at http://0.0.0.0:8000

Go to http://localhost:8000/echo/foo to start sending heka messages
over UDP to localhost:5565.
