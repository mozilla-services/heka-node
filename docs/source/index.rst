.. metlog-node documentation master file, created by
   sphinx-quickstart on Mon Oct 22 14:51:06 2012.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. include:: ../README.rst

There are two primary components to the metlog-node library, the :doc:`api/config`
config class which exposes a factory function to generate a configured
client, and the various :doc:`api/senders` classes, one of which must
be provided to the factory function and which handles the actual
delivery of the message to the router component.

The MetlogClient must be instantiated with the factory functions.  The
raw class definition is not exposed through the public api.

Folks new to using Metlog will probably find :doc:`config` a good
place to get started.

Welcome to metlog-node's documentation!
=======================================

Contents:

.. toctree::
   :maxdepth: 5

   getstarted
   config
   api/client.rst


Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`

