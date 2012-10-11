all:
	npm link .
test:
	node node_modules/jasmine-node/lib/jasmine-node/cli.js tests
