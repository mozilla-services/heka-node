Getting Started
===============

There are two primary components with which users of the heka-node library
should be aware. The first is the :doc:`api/client`
clientFromJsonConfig factory function. 

The HekaClient exposes the Heka API, and is generally your main
point of interaction with the Heka system. The client doesn't do
very much, however; it just provides convenience methods for
constructing messages of various types and then passes the messages
along. Actual message delivery is handled by a `stream`.
Without a properly configured stream, a HekaClient
is useless.
