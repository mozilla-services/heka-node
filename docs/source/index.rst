.. heka-node documentation master file, created by
   sphinx-quickstart on Mon Oct 22 14:51:06 2012.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

.. include:: ../README.rst

The primary component to the heka-node library, is the
:doc:`api/client` client class which exposes a `clientFromJsonConfig`
factory function that will generate a configured client.

The HekaClient should be instantiated with the factory function. 

Folks new to using Heka will probably find :doc:`config` a good
place to get started.

Welcome to heka-node's documentation!
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

