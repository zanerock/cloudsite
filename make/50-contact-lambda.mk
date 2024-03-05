CONTACT_LAMBDA_DIR:=$(SRC)/lib/options/contact-handler/lambda-package
CONTACT_LAMBDA_SRC:=$(shell find $(CONTACT_LAMBDA_DIR) -not -path "*/node_modules/*")
CONTACT_LAMBDA_ZIP:=$(DIST)/contact-lambda.zip

$(CONTACT_LAMBDA_ZIP): $(CONTACT_LAMBDA_SRC)
	cd $(CONTACT_LAMBDA_DIR) \
		&& npm i \
		&& npm prune
	zip -r $(CONTACT_LAMBDA_ZIP) $(CONTACT_LAMBDA_DIR)

BUILD_TARGETS+=$(CONTACT_LAMBDA_ZIP)