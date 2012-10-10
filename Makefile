all:
	npm link .
test:
	jasmine-node tests
