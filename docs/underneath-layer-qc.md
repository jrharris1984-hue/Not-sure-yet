# Underneath-layer prompt regression

A full outer outfit and its optional underneath layer are independent selections. The compact wardrobe compiler deliberately omitted the raw set_lingerie field, but only clothing-coverage modes that already described that layer restored it. Detailed image compilers could also omit the optional layer when they formatted only the outer outfit. Thus Include lingerie plus a chosen layer could be active in the editor but missing from the sent prompt.

The compiler now retains the resolved layer with explicit underneath-clothing context whenever it is enabled and an outer outfit remains. Clothing coverage still determines visibility. A closed outfit can conceal the layer; this fix does not force exposure or change the chosen outfit, coverage, anatomy, model or sampling settings.

Built-in underneath choices reuse complete lingerie ensembles. The render copy now keeps their undergarments and hosiery while removing ensemble robes and footwear that would compete with the outer outfit. Unknown or authored keyword wording is preserved.

Disabled layers remain saved and absent from output. Custom mode does not activate the saved full-set layer. A lingerie outfit is not described as its own underneath layer, and duplicate wording already present in the prompt is not appended again. Multi-character descriptions retain each character's layer separately. Custom prompt-library keywords are preserved.

Regression coverage includes compact and detailed Chroma, Krea, standard, SDXL and Pony output; layer inclusion/disable state; matching defaults; authored keywords; source immutability; selection-audit inclusion; and subject-specific deduplication. These combined-layer cases supplement the earlier isolated-option matrix.

Validation is through compiler tests and a production build; no live ComfyUI render comparison was performed.
