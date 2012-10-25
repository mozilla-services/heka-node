Metlog Configuration
--------------------

To assist with getting a working Metlog set up, metlog-node provides a
:doc:`api/config` module which will take declarative configuration info in
JSON format and use it to configure a MetlogClient instance. 


JSON format
===========

The `clientFromJsonConfig` function of the config module is used to
create a MetlogClient instance.

A minimal configuration that will instantiate a working Metlog client
may look like this ::

    var metlog = require('metlog');
    var METLOG_CONF = {
        'sender': {'factory': 'metlog/Senders:udpSenderFactory',
                   'hosts': '192.168.20.2',
                   'ports': 5565},
    };
    var jsonConfig = JSON.stringify(METLOG_CONF);
    var log_client = metlog.clientFromJsonConfig(jsonConfig);

There are several optional parameters you may use to specialize the
metlog-node client.  A detailed description of each option follows:

logger
  Each metlog message that goes out contains a `logger` value, which is simply
  a string token meant to identify the source of the message, usually the
  name of the application that is running. This can be specified separately for
  each message that is sent, but the client supports a default value which will
  be used for all messages that don't explicitly override. The `logger` config
  option specifies this default value. This value isn't strictly required, but
  if it is omitted '' (i.e. the empty string) will be used, so it is strongly
  suggested that a value be set.

severity
  Similarly, each metlog message specifies a `severity` value corresponding to
  the integer severity values defined by `RFC 3164
  <https://www.ietf.org/rfc/rfc3164.txt>`_. And, again, while each message can
  set its own severity value, if one is omitted the client's default value will
  be used. If no default is specified here, the default default (how meta!)
  will be 6, "Informational".

disabledTimers
  Metlog natively supports "timer" behavior, which will calculate the amount of
  elapsed time taken by an operation and send that data along as a message to
  the back end. Each timer has a string token identifier. Because the act of
  calculating code performance actually impacts code performance, it is
  sometimes desirable to be able to activate and deactivate timers on a case by
  case basis. The `disabledTimers` value specifies a set of timer ids for
  which the client should NOT actually generate messages. Metlog will attempt
  to minimize the run-time impact of disabled timers, so the price paid for
  having deactivated timers will be very small. Note that the various timer ids
  should be newline separated.


filters
  You can configure client side filters to restrict messages from
  going to the server.

The following snippet demonstrates settings all optional parameters in
the metlog client ::

    var config = {
        'sender': {'factory': './example/config_imports:makeMockSender' },
        'logger': 'test',
        'severity': metlog.SEVERITY.INFORMATIONAL,
        'disabledTimers': ['disabled_timer_name'],
        'filters': [['./example/config_imports:payloadIsFilterProvider' , {'payload': 'nay!'}]],
        'plugins': {'showLogger': {'provider': './example/config_imports:showLoggerProvider',
                                    'label': 'some-label-thing' }}
    };
    var jsonConfig = JSON.stringify(config);
    var client = metlog.clientFromJsonConfig(jsonConfig);


You can find more runnable code samples at
http://github.com/mozilla-services/metlog-node/ in the examples
subdirectory.
