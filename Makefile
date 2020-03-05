PATH := ./node_modules/.bin:$(PATH)
NODE_ENV = development

NPM = npm
RM = rm -rf

# BEGIN-EVAL makefile-parser --make-help Makefile

help:
	@echo ""
	@echo "  Targets"
	@echo ""
	@echo "    build  Build all"
	@echo "    watch  Build continuously"
	@echo "    clean  Remove dist"
	@echo "    test   Run tests"
	@echo "    dist   Build production bundle"
	@echo "    serve  Serve samples on localhost:3003"

# END-EVAL

.PHONY: build
# Build all
build: dist node_modules

.PHONY: watch
# Build continuously
watch:
	webpack -w

.PHONY: clean
# Remove dist
clean:
	$(RM) dist

.PHONY: test
# Run tests
test:
	tap -Rspec test/*.test.js

.PHONY: dist
# Build production bundle
dist: src
	NODE_ENV='production' webpack -p --config webpack.config.js

node_modules: package.json
	$(NPM) install

.PHONY: serve
# Serve samples with webpack-dev-server and start browser
serve:
	webpack-dev-server --open
