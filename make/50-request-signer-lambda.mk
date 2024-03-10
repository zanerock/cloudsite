REQUEST_SIGNER_LAMBDA_DIR:=$(SRC)/lib/shared/request-signer
REQUEST_SIGNER_LAMBDA_SRC:=$(shell find $(REQUEST_SIGNER_LAMBDA_DIR) -not -path "*/node_modules/*")
REQUEST_SIGNER_LAMBDA_ZIP:=$(DIST)/request-signer-lambda.zip

$(REQUEST_SIGNER_LAMBDA_ZIP): $(REQUEST_SIGNER_LAMBDA_SRC)
	cd $(REQUEST_SIGNER_LAMBDA_DIR) \
		&& npm i \
		&& npm prune
	cd $(REQUEST_SIGNER_LAMBDA_DIR) && zip -r $(PWD)/$@ .

BUILD_TARGETS+=$(REQUEST_SIGNER_LAMBDA_ZIP)