# Detail controls and photorealism QC

The Intimate editor now emphasizes independent size, shape, color and texture fields. Older combined presets are available behind a disclosure, with an active saved-choice indication. Existing characters, locks and prompt-library entries are retained.

Known built-in combined presets supply missing dimensions on a render copy. A newer individual dimension wins only for that dimension; selecting a size no longer discards an older color choice. Unknown presets and authored keyword overrides are retained rather than guessed or replaced. Custom prose is not a structured constraint and still needs human review when it embeds contradictory descriptions.

The lean single-character Chroma compiler now retains the resolved anatomical size, shape, color and texture fields rather than silently dropping them. Covering-outfit suppression still runs first.

Feet Styling now resolves exclusivity using stable option IDs, including when the prompt library replaces labels with custom keywords. The corresponding keyword phrases and selection snapshots are removed together. An older socks/nylons foot-state selection supplies a covering when no hosiery control is selected; closed shoes and opaque socks suppress hidden nail details, and covered soles suppress bare-sole details. Nail shape supersedes older length-only pedicure presets; explicit sole texture supersedes older texture-only presentation presets; foot state owns cleanliness; foot accessories owns duplicate toe-ring choices. Saved source selections are not changed.

The existing photographic image compiler pipeline remains active: catalog translation, cast/pose and shared-control resolution, wardrobe/visibility checks, body-proportion priority, model-specific compilation, photographic guidance, and compact-format handling. Image compilers add natural skin/lighting/lens guidance and limb-location instructions. Negative guidance is model-specific; workflows with zeroed negatives cannot rely on negative prompt wording. Direct editing/video workflows have separate behavior and must not be forced into an image compiler.

No extra steps, CFG, model files or samplers are automatically changed by this fix. Prompt consistency improves what is sent, but cannot guarantee photographic output. Model choice, supported encoder/VAE, sampling recipe, resolution, visible composition and intentional proportion stylization still determine results. This QC uses compiler/UI tests and a production build, not a live GPU render comparison.
