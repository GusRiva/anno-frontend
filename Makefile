PATH := ./node_modules/.bin:$(PATH)
NODE_ENV = development
DEPLOY_SERVER = serv7
DEPLOY_PATH = /usr/local/AnnotationService/htdocs/dist

NPM = npm
RM = rm -rf

.PHONY: help
help:
	@echo ""
	@echo "Targets:"
	@echo ""
	@echo "    build   webpack"
	@echo "    watch   webpack -w "
	@echo "    serve   webpack-dev-server "
	@echo "    clean   remove dist"
	@echo "    dist    Build js and html"
	@echo "    dist    Build js and html"
	@echo '    deploy  SSH-Copy to $$(DEPLOY_SERVER):$$(DEPLOY_PATH)'
	@echo ""
	@echo "Variables:"
	@echo ""
	@echo "    DEPLOY_SERVER: Server to deploy to. Default: $(DEPLOY_SERVER)"
	@echo "    DEPLOY_PATH: Path to deploy to. Default: $(DEPLOY_PATH)"


.PHONY: build
build: dist node_modules

.PHONY: watch
watch:
	webpack -w

.PHONY: serve
serve:
	webpack-dev-server --content-base .

.PHONY: clean
clean:
	$(RM) dist

.PHONY: test
test:
	tap -Rspec test/*.test.js

.PHONY: deploy
deploy: dist
	ssh $(DEPLOY_SERVER) mkdir -p $(DEPLOY_PATH)
	scp dist/* $(DEPLOY_SERVER):$(DEPLOY_PATH)
	
dist: src
	webpack
	cp demo.html dist/index.html

node_modules: package.json
	$(NPM) install
