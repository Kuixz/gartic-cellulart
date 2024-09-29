
UC = $(call IUC,$(1))
IUC = $(shell echo '$(1)' | tr '[:lower:]' '[:upper:]')

LC = $(call ILC,$(1))
ILC = $(shell echo '$(1)' | tr '[:upper:]' '[:lower:]')

PACKAGE_VERSION := 1.3.0

MANIFEST ?= Chrome

define package-for
	manifest=$(call LC,${1}) mode=production pnpm run build 
	zip -r $(call UC,${1})_$(PACKAGE_VERSION).zip dist/* -x '**/.*' -x '**/__MACOSX'; 
endef

.PHONY: package-both
package-both:
	# Packaging...
	$(call package-for,Chrome)
	$(call package-for,Firefox)
	# Complete