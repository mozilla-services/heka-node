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
