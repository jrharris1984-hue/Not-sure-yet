# Workflow defaults: MOSS and Kroma

This phase addresses the MOSS settings and Kroma override findings in the October 24 prompt audit. It does not change prompt wording or video assembly.

MOSS selection now uses the same handler in the main dropdown, desktop review, mobile output controls, and Smart Setup. Selecting Stardust, Jib or FinalCut reads that workflow's stored graph rather than carrying sampling settings from another MOSS checkpoint. Initial default selection also reads the graph. Draft and exact recipe restoration continue to use their saved settings rather than the selection handler.

MOSS presets are labeled Smaller / Default / Larger (or their canvas equivalents):

- Default uses the graph's canvas and sampling values.
- Smaller scales each canvas dimension by 0.75.
- Larger scales each canvas dimension by 1.25.
- Dimensions are rounded to multiples of 16 and bounded to 256–2048.
- All presets reapply the graph's steps, CFG, sampler and scheduler. They do not preserve prior manual sampling changes; the controls explain that the workflow baseline is used. Advanced settings remain editable afterward.

These are canvas presets, not measured quality rankings. The selected workflow's graph remains authoritative, including locally edited graph defaults. Reading defaults currently supports one KSampler plus an EmptyFlux2LatentImage with valid literal settings. Unsupported/invalid defaults disable preset cards; explicit selection reports an error instead of applying generic sampling.

Kroma no longer enters the fixed Krea Turbo branch, so its 12-step Quality preset is not forced to eight steps by Builder. Native Krea Turbo and Krea AIO retain their existing fixed sampling behavior.

Validation: 41 tests across five suites passed, covering all three bundled MOSS graphs and their presets, invalid/ambiguous settings, displayed defaults after same-family model changes, non-mutating control renders, existing workspace generation and draft restoration. Production build passed with the existing bundle-size warning.

Local acceptance checks after merging and rebuilding the frontend:

1. Select each MOSS workflow from the main selector, then desktop Review & create and mobile output controls. Compare Advanced steps/CFG against its graph: Stardust 25/3, Jib 8/1, FinalCut 6/2.5 for unmodified bundled graphs.
2. Choose Smaller, Default and Larger. Verify canvas changes while each graph's sampling baseline remains distinct.
3. Adjust steps manually, switch Simple/Advanced views, then open the same saved draft or exact recipe. Confirm saved settings are retained.
4. Choose Kroma Quality and verify 12 steps in the dispatched render metadata.
5. Run the Windows UI checks. Browser checks and GPU comparisons were not run in the development environment.

No model files, LoRAs, backend data, or workflow seed graphs change in this phase.
