Heka Configuration
--------------------

To assist with getting a working Heka set up, heka-node provides a
:doc:`api/client` module which will take declarative configuration info in
JSON format and use it to configure a HekaClient instance. 


JSON format
===========

The `clientFromJsonConfig` function of the config module is used to
create a HekaClient instance.

A minimal configuration that will instantiate a working Heka client
may look like this ::

    var heka = require('heka');
    var heka_CONF = {
        'stream': {'factory': 'heka/streams:udpStreamFactory',
                   'hosts': ['localhost'],
                   'ports': [5565]
         },
        'logger': 'test',
        'severity': heka.SEVERITY.INFORMATIONAL
    };
    var jsonConfig = JSON.stringify(heka_CONF);
    var log_client = heka.clientFromJsonConfig(jsonConfig);

There are several optional parameters you may use to specialize the
heka-node client.  A detailed description of each option follows:

logger
  Each heka message that goes out contains a `logger` value, which is simply
  a string token meant to identify the source of the message, usually the
  name of the application that is running. This can be specified separately for
  each message that is sent, but the client supports a default value which will
  be used for all messages that don't explicitly override. The `logger` config
  option specifies this default value. This value isn't strictly required, but
  if it is omitted '' (i.e. the empty string) will be used, so it is strongly
  suggested that a value be set.

severity
  Similarly, each heka message specifies a `severity` value corresponding to
  the integer severity values defined by `RFC 3164
  <https://www.ietf.org/rfc/rfc3164.txt>`_.  While each message can
  set its own severity value, if one is omitted the client's default value will
  be used. If no default is specified here, the default default (how meta!)
  will be 6, "Informational".

disabledTimers
  Heka natively supports "timer" behavior, which will calculate the amount of
  elapsed time taken by an operation and send that data along as a message to
  the back end. Each timer has a string token identifier. Because the act of
  calculating code performance actually impacts code performance, it is
  sometimes desirable to be able to activate and deactivate timers on a case by
  case basis. The `disabledTimers` value specifies a set of timer ids for
  which the client should NOT actually generate messages. Heka will attempt
  to minimize the run-time impact of disabled timers, so the price paid for
  having deactivated timers will be very small. Note that the various timer ids
  should be newline separated.

filters
  You can configure client side filters to restrict messages from
  going to the server.


Setting up a heka-node client
=============================

The following snippet demonstrates setting up a minimal heka-node client that writes out
protocol buffer formatted messages to localhost on port 5565.  ::

    var heka = require('heka');
    var config = {
        'stream': {'factory': 'heka/streams:udpStreamFactory',
                   'hosts': ['localhost'],
                   'ports': [5565]
        },
        'logger': 'test',
        'severity': heka.SEVERITY.INFORMATIONAL
    };

    var jsonConfig = JSON.stringify(config);
    var client = heka.clientFromJsonConfig(jsonConfig);

Streams
=======

The heka client supports different kinds of output streams. 

Each stream allows at least the one parameter `hmc` which specifies
the kind of HMAC signature to use when signing messages.  By default,
`hmc` is set to null and no signatures will be written into the header
portion of the serialized message.

debugStreamFactory
==================

  Buffers messages into a list within the stream.  This is useful if
  you want to capture your own messages for inspection within a unit
  test suite.  Example usage can be found in the heka-node testsuite.

  No extra configuartion parameters are supported.

  Sample configuration ::

    var heka = require('heka');
    var config = {
        'stream': {'factory': 'heka/streams:debugStreamFactory'},
        'logger': 'test',
        'severity': heka.SEVERITY.INFORMATIONAL
    };

fileStreamFactory
=================

  Write messages out into a filepath.  The parent directory of the
  file must exist.

  `filepath` is a required parameter.  The parent directory of
  `filepath` must exist or the heka-client will error out during
  initialization.

  Sample configuration ::

    var heka = require('heka');
    var config = {
        'stream': {'factory': 'heka/streams:fileStreamFactory',
                   'filepath': '/tmp/some_output_file.txt'},
        'logger': 'test',
        'severity': heka.SEVERITY.INFORMATIONAL
    };

stdoutStreamFactory
===================

  Writes messages directly to stdout.  This is probably not useful
  to most people as all messages are serialized to protocolbuffer
  prior to being written to a stream.  This output stream may be
  useful if you implement an encoder to replace the ProtobufEncoder.

  No extra configuration parameters are supported.

  Sample configuration ::

    var heka = require('heka');
    var config = {
        'stream': {'factory': 'heka/streams:stdoutStreamFactory'},
        'logger': 'test',
        'severity': heka.SEVERITY.INFORMATIONAL
    };

udpStreamFactory
================

  Writes messages to one or more hosts.

  udpStreamFactory expects `hosts` and `ports` to be defined.

  Sample configuration ::

    var heka = require('heka');
    var config = {
        'stream': {'factory': 'heka/streams:udpStreamFactory',
                   'hosts': ['localhost'],
                   'ports': [5565],
        },
        'logger': 'test',
        'severity': heka.SEVERITY.INFORMATIONAL
    };

Filters
=======

Filters can be used to suppress the client from emitting messages
which match specific criteria.  We currently provide the following
filters :

typeBlacklistProvider
    Suppress any messages where the `type` attribute matches one of the `types`
    in the provider.

    Sample Configuration ::
        var config = {'types': {'foo': {'severity': 3}}};

typeWhitelistProvider
    Only allow messages to pass through where the `type` matches one
    of the `types` in the provider.

severityMaxProvider
    Only allow message to pass through if the severity of the message
    is strictly greater than the `severity` in the provider.

typeSeverityMaxProvider
    Given a dictionary of type to severity, only allow message to pass
    through for a given type if the severity of the message is
    strictly greater than the one specified in the configuration.

    For messages where the `type` is not specified, allow the message
    through regardless of the severity.

Example usage for each of these filter is available in the
filters.spec.js testsuite


Disabling Timers
================

The heka client will let you disable calls to the `timer()` method.
Each call to `timer()` requires a timer name in the second positional
argument.  Passing in a list of names, or a wildcard ('*') will
disable any timer calls where the timer name matches at least one of
the disabled timer names.

The configuration expects either a list  of message `type` names which 
match timer messages that will be excluded.  You can also use a
wildcard `*` to disable all timer code.

Example configuration ::

    var config = {
        'stream': {'factory': 'heka/streams:debugStreamFactory'},
        'logger': 'test',
        'severity': 5,
        'disabledTimers': ['some_disabled_type'],
    };
    var jsonConfig = JSON.stringify(config);
    var client = configModule.clientFromJsonConfig(jsonConfig);


Plugins
=======

Plugins can be bound to the heka-node client using the `plugins` key
of the configuration dictionary.  You must provide at least a `provider` key
which will be resolved into a factory function to bind a new method
onto the heka-node client. Any additional key/value pairs in the
plugin configuration are passed into the factory function to configure
the plugin.

Example configuration ::

    var config = {
        'stream': {'factory': 'heka/streams:debugStreamFactory'},
        'logger': 'test',
        'severity': 5,
        'plugins': {'showLogger': {'provider': './tests/plugins.spec.js:showLoggerProvider',
                                   'label': 'some_custom_label'}}
    };
    var jsonConfig = JSON.stringify(config);
    var client = configModule.clientFromJsonConfig(jsonConfig);
