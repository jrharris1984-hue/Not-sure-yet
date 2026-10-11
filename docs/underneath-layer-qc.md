# Underneath-layer prompt regression

A full outer outfit and its optional underneath layer are independent selections. The compact wardrobe compiler deliberately omitted the raw set_lingerie field, but only clothing-coverage modes that already described that layer restored it. Detailed image compilers could also omit the optional layer when they formatted only the outer outfit. Thus Include lingerie plus a chosen layer could be active in the editor but missing from the sent prompt.

The compiler now retains the resolved layer with explicit underneath-clothing context whenever it is enabled and an outer outfit remains. Clothing coverage still determines visibility. A closed outfit can conceal the layer; this fix does not force exposure or change the chosen outfit, coverage, anatomy, model or sampling settings.

Built-in underneath choices reuse complete lingerie ensembles. The render copy now keeps their undergarments and hosiery while removing ensemble robes and footwear that would compete with the outer outfit. Unknown or authored keyword wording is preserved.

Disabled layers remain saved and absent from output. Custom mode does not activate the saved full-set layer. A lingerie outfit is not described as its own underneath layer, and duplicate wording already present in the prompt is not appended again. Multi-character descriptions retain each character's layer separately. Custom prompt-library keywords are preserved.

Regression coverage includes compact and detailed Chroma, Krea, standard, SDXL and Pony output; layer inclusion/disable state; matching defaults; authored keywords; source immutability; selection-audit inclusion; and subject-specific deduplication. These combined-layer cases supplement the earlier isolated-option matrix.

Validation is through compiler tests and a production build; no live ComfyUI render comparison was performed.

## Garment coverage and body shape

The older compact rule for a pantsuit plus visible garter stockings explicitly removed trousers. It now retains the chosen outer outfit and describes hosiery as an underneath layer concealed by the trousers. Unbuttoned, unzipped, undone, and lingerie-showing coverage can open the outer top and trouser fastening enough to show the underwear while keeping trousers worn. Slipping off remains a removal request; the compiler does not silently reinterpret it as an open zipper.

A conventional selected bra and briefs remain covering garments even when outer clothing opens. Their covering placement is explicit in compact and detailed image prompts. Transparent, sheer, open-cup, cutout and otherwise ambiguous layers do not receive inferred full coverage.

Visibility is resolved independently for upper and lower body regions. Known covering tops omit nipple and areola surface fields; covering pants, skirts, dresses, shorts and briefs omit concealed lower anatomy fields. Body proportions and shape fields remain active. Concealed piercing details are also filtered by region. Saved character selections are not changed, and explicit removal coverage remains authoritative. Unknown custom garment wording is not assigned guessed coverage.

Regression checks cover the floral bra/briefs/garter ensemble with a pantsuit across five image compilers in compact and detailed formats, region-specific concealment, source immutability, retained shape, transparent garments and removal choices. No live GPU render was performed; these checks establish prompt behavior rather than guaranteed image fidelity.
