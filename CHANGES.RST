0.2.0 - May 1, 2013
===================

- hekad 0.2.0 support!
- Lots of changes, mostly wire format but you should retest your code
  with this release
- msgpack has been dropped
- ProtocolBuffers is now a required dependency.
- The new wire format is basically a protobuf header, and either a
  JSON or Protobuf encoded payload.  
- JSON encoding of the payload has been changed for hekad 0.2.0


0.1.1
================

- Changed the timestamp format to match Hekad with a trailing Z for
  UTC timestamps and added nanosecond resolution to the timestamp

0.1
================

- Initial release
