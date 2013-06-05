===========
heka-node
===========

.. image:: https://secure.travis-ci.org/mozilla-services/heka-node.png

heka-node is a Node.js client for the "Heka" system of application logging and
metrics gathering developed by the `Mozilla Services
<https://wiki.mozilla.org/Services>`_ team. The Heka system is meant to make
life easier for application developers with regard to generating and sending
logging and analytics data to various destinations. It achieves this goal (we
hope!) by separating the concerns of message generation from those of message
delivery and analysis. Front end application code no longer has to deal
directly with separate back end client libraries, or even know what back end
data storage and processing tools are in use. Instead, a message is labeled
with a type (and possibly other metadata) and handed to the Heka system,
which then handles ultimate message delivery.

More information about how Mozilla Services is using Heka (including what is
being used for a router and what endpoints are in use / planning to be used)
can be found in the `heka-docs 
<https://github.com/mozilla-services/heka-docs>`_ repository on github.

You can find a pre-rendered version of that documentation on
readthedocs.org at `heka-docs.rtfd.org <http://heka-docs.rtfd.org>`_.
