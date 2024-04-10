INDEX_REWRITER_LAMBDA_DIR:=$(SRC)/lib/plugins/index-rewriter/index-rewriter-lambda
INDEX_REWRITER_LAMBDA_SRC:=$(shell find $(INDEX_REWRITER_LAMBDA_DIR) -not -path "*/node_modules/*")
INDEX_REWRITER_LAMBDA_ZIP:=$(DIST)/index-rewriter-lambda.zip

$(INDEX_REWRITER_LAMBDA_ZIP): $(INDEX_REWRITER_LAMBDA_SRC)
	cd $(INDEX_REWRITER_LAMBDA_DIR) \
		&& npm i \
		&& npm prune
	cd $(INDEX_REWRITER_LAMBDA_DIR) && zip -r $(PWD)/$@ .

BUILD_TARGETS+=$(INDEX_REWRITER_LAMBDA_ZIP)