
UC = $(call IUC,$(1))
IUC = $(shell echo '$(1)' | tr '[:lower:]' '[:upper:]')

LC = $(call ILC,$(1))
ILC = $(shell echo '$(1)' | tr '[:upper:]' '[:lower:]')

PACKAGE_VERSION := 1.2.0

MANIFEST ?= Chrome

define package-for
	pnpm run build --manifest=$(call LC,${1})
	zip -r $(call UC,${1})_$(PACKAGE_VERSION).zip dist/* -x '**/.*' -x '**/__MACOSX'; 
endef

.PHONY: package-both
package-both:
	echo Packaging...
	$(call package-for,Chrome)
	$(call package-for,Firefox)
	echo Complete