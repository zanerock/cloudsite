CLOUDSITE_CLI_DEF:=$(SRC)/cli/constants.mjs
CLOUDSITE_CLI_REF_BUILT=site/docs/user-guides/command-line-reference.md

BUILD_TARGETS+=$(CLOUDSITE_CLI_REF_BUILT)

SHELL=/bin/bash

$(CLOUDSITE_CLI_REF_BUILT): $(CLOUDSITE_CLI_DEF) $(SDLC_CLOUDSITE_EXEC_JS)
	echo -e '---\nsidebar_position: 1\ndescription: Documents available Cloudsite commands.\n---' > $@
	$(SDLC_CLOUDSITE_EXEC_JS) --no-reminders document --section-depth 1 --title "Command Line Reference"  >> $@

