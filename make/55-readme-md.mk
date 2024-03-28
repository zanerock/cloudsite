CLOUDSITE_README_PREFIX:=$(SRC)/docs/README-prefix.md
CLOUDSITE_README_SUFFIX:=$(SRC)/docs/README-suffix.md
CLOUDSITE_CLI_DEF:=$(SRC)/cli/constants.mjs
CLOUDSITE_README_BUILT=./README.md

BUILD_TARGETS+=$(CLOUDSITE_README_BUILT)

$(CLOUDSITE_README_BUILT): $(CLOUDSITE_README_PREFIX) $(CLOUDSITE_README_SUFFIX) $(CLOUDSITE_CLI_DEF)
	cp $(CLOUDSITE_README_PREFIX) $@
	echo >> $@
	$(SDLC_CLOUDSITE_EXEC_JS) document >> $@
	cat $(CLOUDSITE_README_SUFFIX) >> $@

