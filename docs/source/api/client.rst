Basic Usage
===========

After instantiating your logger, you can start sending counters and
timers using the heka-node client.

Increment counters
------------------

Counters increment a named value.  You may increment the counter by
values other than 1, and you can take random samples instead of
sending an increment message every time.

Typically, these messages go into statsd.

Signature ::

    incr(name, opts={}, sample_rate=1.0)

The simplest way to increment a counter is to simply name the counter

    log.incr('demo.node.incr_thing');

Options:

    The incr() method takes two optional arguments, an opts dictionary
    and a sample_rate.

    `name` is the name of the counter you are incrementing.

    The opts dictionary may include an integer `count` and dictionary `fields`.
    `count` represents the number to increment by in case you want to
    increase the counters by more than the default of 1.

    `fields` is a dictionary of data.  By default, heka-node will
    create this dictionary for you and autopopulate the name and
    sampling rate into the dictionary for you.  If you supply fields,
    you can supply additional key value pairs to store into fields.

    If the sample_rate is supplied, it must be a float from 0 to 1.0.
    heka-node will compute a random number.  If the random number is
    greater than the sample_rate, then *no* message is delivered. 

Example ::

    log.incr('some_counter', {count: 2, my_meta: 42}, 0.25)

Will send a message ~25% of the time to hekad.  Each increment will
increase the count of 'some_counter' by 2 and will also send a field
'my_meta' with a value of 42 to the server.


Timers
------

The timer method provides a way to decorate functions so that you will
emit timing messages whenever the function is invoked.

Typically, these messages go into statsd.

Signature ::

    timer(fn, name, opts={})


    `fn` is the function to be called
    `name` is the name of the event you are measuring.
    `opts` may contain a `rate` attribute which specifies a sampling
           rate for timer messages.

    The return value of `timer` is your decorated function



Encoders
--------


The heka wire format for 0.2 currently uses ProtocolBuffers to encode
the header and you may use ProtocolBuffer or JSON to encode the
payload.

At this time, please use the JSON encoder only.  There are known bugs
when the ProtocolBuffer encoder is applied to the payload of the
message body.
