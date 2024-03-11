EMAILER_LAMBDA_DIR:=$(SRC)/lib/plugins/contact-handler/contact-emailer-lambda
EMAILER_LAMBDA_SRC:=$(shell find $(EMAILER_LAMBDA_DIR) -not -path "*/node_modules/*")
EMAILER_LAMBDA_ZIP:=$(DIST)/contact-handler-lambda.zip

$(EMAILER_LAMBDA_ZIP): $(EMAILER_LAMBDA_SRC)
	cd $(EMAILER_LAMBDA_DIR) \
		&& npm i \
		&& npm prune
	cd $(EMAILER_LAMBDA_DIR) && zip -r $(PWD)/$@ .

BUILD_TARGETS+=$(EMAILER_LAMBDA_ZIP)