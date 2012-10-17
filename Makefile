all:
	npm link .

test:
	node node_modules/jasmine-node/lib/jasmine-node/cli.js tests

test_demo:
	node example/demo.js
