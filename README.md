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
    $ make
    npm install heka
    npm WARN package.json heka_node_demo@0.2.0 No README.md file found!
    npm http GET https://registry.npmjs.org/heka
    npm http 200 https://registry.npmjs.org/heka
    npm WARN engine heka@0.3.0: wanted: {"node":">=0.10.0"} (current:
    {"node":"v0.8.10","npm":"1.1.62"})
    npm http GET https://registry.npmjs.org/bytebuffer/1.3.6

    [...lots of packages installing editted out here ...]

    heka@0.3.0 node_modules/heka
    ├── underscore@1.4.4
    ├── bytebuffer@1.3.6 (long@1.1.2)
    ├── protobufjs@1.0.0-b4 (ascli@0.3.0)
    └── superscore@0.3.4 (request@2.21.0)
    node demo.js
    myapp listening at http://0.0.0.0:8000

Go to http://localhost:8000/echo/foo to start sending heka messages
over UDP to localhost:5565.
