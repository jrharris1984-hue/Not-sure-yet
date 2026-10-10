# Selection-to-prompt check

In Studio, open **Selection-to-prompt check** below the prompt preview. Desktop
Quick Create also shows it on the Generate review screen. The checklist is
available in the mobile prompt tools through the same prompt preview.

The compiler records selected visual fields and their resolved inputs. The
checklist compares those requirements with the final positive prompt after
manual edits, AI rewrites, photographic guidance, and LoRA trigger additions.

- **Included:** matching wording was detected.
- **Inactive:** a competing control or compiler rule replaced or disabled the
  saved selection. The row explains why when the resolver supplies a reason.
- **Not detected:** expected wording was not found. Inspect the prompt; a
  paraphrase may still represent the selection.

Multi-select choices receive separate rows. Personal traits are checked within
the corresponding person's labeled prompt blocks. Shared scene controls use
the primary subject. Compact prompts are checked using their compact wording.
Numeric slider checks also recognize the exact emitted slider signatures.

This is an approximate text check, not image review or an encoder token check.
It does not guarantee the model will draw a detail, edit prompts, or block
generation. Compiler behavior controls, such as outfit mode and anatomy mode,
are not counted as independent visual details. Reference-based image edits
retain their dedicated instruction compiler and do not show this checklist.

To test it, choose a hair color and a size slider, then inspect their rows.
Apply a manual prompt that omits the hair description: its row should switch
to Not detected. Choose a size preset and increase its matching size slider:
the preset should become Inactive while the slider stays active. Restore the
generated prompt before rendering if you want the original selections used.
