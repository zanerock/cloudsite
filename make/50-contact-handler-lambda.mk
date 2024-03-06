CONTACT_LAMBDA_DIR:=$(SRC)/lib/plugins/contact-handler/lambda-package
CONTACT_LAMBDA_SRC:=$(shell find $(CONTACT_LAMBDA_DIR) -not -path "*/node_modules/*")
CONTACT_LAMBDA_ZIP:=$(DIST)/contact-handler-lambda.zip

$(CONTACT_LAMBDA_ZIP): $(CONTACT_LAMBDA_SRC)
	cd $(CONTACT_LAMBDA_DIR) \
		&& npm i \
		&& npm prune
	cd $(CONTACT_LAMBDA_DIR) && zip -r $(PWD)/$@ .

BUILD_TARGETS+=$(CONTACT_LAMBDA_ZIP)