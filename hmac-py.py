import hmac
import hashlib

key = 'my key'
print "python: " + hmac.new(key, 'my content', hashlib.sha1).hexdigest()
