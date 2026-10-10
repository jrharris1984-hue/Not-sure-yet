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


Custom Clothing coverage choices can define a **Coverage behavior** in the
Prompt Library editor. This determines whether selected garments remain,
open, or are replaced; the keywords and compact wording describe the look.
Topless and bottomless preserve separate remaining garment controls. For an
exact remaining garment, choose Custom outfit mode instead of a combined full
set. When a full set cannot be split, the compiler uses a generic remaining
upper or lower garment and reports the combined outfit as inactive.

Backups accept up to 2 MB of file data and 1 million serialized characters of
catalog data. Coverage behavior metadata survives saving and downloading.

Clothing Coverage now defaults to the 22 simple choices from topless through
nothing but jewelry. Existing edited coverage lists remain until replaced:
Settings → Edit Prompt Library → Wardrobe → Clothing coverage → Use simple
coverage list → Save library. This replaces only that field's choices and keeps
matching saved IDs, including renamed choices such as unbuttoned shirt.

Topless/bottomless remove the corresponding garment fields; topless and barefoot
also removes shoes/hosiery. Hosiery only, heels only and jewelry only remove
conflicting garment/accessory selections from the compiled request while leaving
the saved recipe intact. Custom outfit mode gives precise control over the
remaining top or bottom; complete sets may use generic remaining garments.
Legacy coverage choices and saved libraries still compile with their existing
behavior. Clearing the selection follows the selected outfit.
