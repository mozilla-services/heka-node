Getting Started
===============

There are two primary components with which users of the metlog-node library
should be aware. The first is the :doc:`api/config`
clientFromJsonConfig factory function. 

The MetlogClient exposes the Metlog API, and is generally your main
point of interaction with the Metlog system. The client doesn't do
very much, however; it just provides convenience methods for
constructing messages of various types and then passes the messages
along. Actual message delivery is handled by a :doc:`sender
<api/senders>`. Without a properly configured sender, a MetlogClient
is useless.

The first question you're likely to ask when using metlog-node, then, will
probably be "How the heck do I get my hands on a properly configured client /
sender pair?" You could read the source and instantiate and configure these
objects yourself, but for your convenience we've provided a :doc:`config`
module that simplifies this process considerably. The config module provides
utility functions that allow you pass in a declarative representation of the
settings you'd like for your client and sender objects, and it will create and
configure them for you based on the provided specifications.
