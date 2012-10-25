Using the metlog client
-----------------------

Basic usage of the metlog client for timing functions is straight
forward.  Just decorate your function with client.timer and you'll get
timing events ::

        var name = 'decorator';
        var minWait = 40;  // in milliseconds
        var sleeper = function() {
            block(minWait);
        };

        // wrap it
        sleeper = client.timer(sleeper, name)

        // call it
        sleeper();

There are several options you can set in the timer like timestamp,
logger name, severity, sampling rate and a fields dictionary.  None of
those are required to get started though.

To send an increment event, you can call the incr() method.  The only
required field is the name of the increment event ::

        var name = "some_name";
        client.incr(name);

You may optionally set an options dictionary to increment by values
other than 1 and you can also change the sample_rate. The following
snippets increments by 2, but only samples half the time on the client
side. ::

        var name = "some_name";
        client.incr(name, {'count': 2}, 0.5);
