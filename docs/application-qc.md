# Application conflict QC — October 11, 2026 (UTC)

This review covers application behavior through the complete frontend test suite,
the offline backend suites, code inspection, and real FastAPI requests against a
new disposable SQLite database. It does not certify that every possible free-text
prompt or external model will produce a correct image.

## Corrections

| Area | Reproduced problem | Corrected behavior |
| --- | --- | --- |
| Two-person/group poses | The picker changed only the active person; other people kept incompatible poses and crops. | Shared choices apply to the cast. Shared body and hand instructions are emitted once; conflicting individual body/hand/foot-pose instructions are inactive for that render. Individual body-pose editing or **Clear shared pose** ends shared ownership. |
| Pose and framing | Each person could request a different crop or camera view. Movement/mixed-level poses could retain a portrait or foot-only crop. | Camera framing is shared. Editing framing on any person updates the whole cast. Full-figure shared poses widen incompatible crops; compatible pair portraits retain their crop. The selection audit identifies replaced framing as inactive. |
| Cast changes | A saved shared action could survive reducing the cast to one person. | Shared-pose metadata is removed from compiler input, and the former shared action is inactive in a one-person render. Character presets and batch changes retain shared ownership where appropriate. |
| Mobile navigation | The route-sync effect immediately reset a newly clicked stage before navigation completed. | Synchronization follows semantic route changes rather than local step changes or recreated configuration objects. |
| Settings | Invalid field types were persisted before model validation, poisoning future settings requests. | Validate the complete proposed settings record before writing. Invalid providers/types fail without saving other accompanying edits or echoing credentials. |
| Workflow selection | A missing explicit workflow silently fell back to another model; requests without an ID could change models while queued. | Missing explicit selections fail clearly at enqueue and dispatch. Legacy/default selections acquire a concrete workflow ID at enqueue. Existing no-ID legacy JSON fallback remains when no registered workflows exist. |
| Search/list inputs | Search punctuation could become an invalid regex; negative list limits caused storage errors. | Character search escapes literal text. Character, queue and shoot list limits are validated before storage access. |
| AI research | Source metadata was sent by the backend but never consumed by the frontend. | Suggestions and the shared research state receive optional source metadata. Missing/malformed metadata preserves successful assistant output and clears stale sources. Disabling research removes a carried retry header. |
| Creation-mode changes | Delayed AI/upload responses could populate the previous mode's state or allocate an orphan preview URL. | Each mode owns a separate workspace. Late suggestions/uploads from an unmounted workspace cannot populate the new one. |
| Render polling | Late/overlapping polls could replace a newer render or batch selection. | Polling rejects responses after cleanup, prevents overlapping requests, and gives a batch a single polling owner. Connection failures retain the current result and retry. |
| Media URLs | Tools/mobile output handling decoded URLs without guarding malformed percent escapes. | These views and Builder downloads use the existing guarded media-type helper. |
| Character presets | Wardrobe presets included a removed coverage choice. | Presets use the supported empty coverage selection. |
| Build/test coverage | Older selectors, hoisted mocks, route harnesses and extracted-hook dependency warnings obscured failures. | Tests use current controls and research middleware/provider contracts. Reviewed stable dependencies are included; Gallery callbacks are stable. |

## Validation

- **1,077 frontend tests passed in 123 suites.** The suite includes library import,
  compiler families, appearance/wardrobe resolution, cast identity, numeric controls,
  photoshoot plans/batching, character preview/capture, gallery, queue, reference/edit
  tools, navigation, settings and AI-assist behavior.
- **184 offline backend tests passed, with 41 subtests.** Coverage includes workflow
  patching/model lookup, generation settings, SQLite queries and migration snapshots,
  durable queue submission/recovery, shoots/continuity/progress, media overlays,
  deletion/recovery, catalog/settings validation and assistant provider/research handling.
- Eleven new API scenarios exercise actual routing and storage together: character
  save/duplicate/tags/locks, literal search, invalid settings, list limits, atomic catalog
  rejection, gallery pagination/bulk albums, fixed-seed retry, missing records, missing
  workflows and default-workflow freezing. Each scenario uses disposable data.
- Every built-in body-pose choice is combined with every built-in crop across six
  still-image compiler families. Every built-in two-person and group pose is also
  combined with every crop for two and three subjects across those families.
  These matrices verify compilation and saved-data immutability; specific regression
  cases verify shared ownership, pose/crop precedence, single action emission and
  identity retention in both detailed and compact prompts.
- The existing per-choice matrix also exercises appearance, wardrobe, pose, scene,
  lighting and camera options and slider endpoints across ten prompt styles.
- Production build succeeds with **CI=true**, including warning enforcement.
- `git diff --check` passes.

## Repeatable offline checks

With the project's frontend and Python test dependencies installed, from the repo:

```powershell
python scripts/run-backend-qc.py
cd frontend
$env:CI = "true"
npm test -- --watch=false --runInBand
npm run build
Remove-Item Env:CI
cd ..
```

The backend runner explicitly selects offline suites; it does not discover the older
live-service CRUD tests, which can write to whichever server their environment points
at. It preserves the repository's configured two-worker pytest execution.

## Remaining verification

- No real ComfyUI/GPU images or videos were generated here. Installed-node/model
  readiness, VRAM, speed, actual pose/identity fidelity, and long encoder-context behavior
  still require the user's installation. Correct text cannot guarantee image adherence.
- Browser/device interaction is covered with component tests; actual desktop/mobile
  layouts, touch behavior, downloads and installed-PWA behavior still need device checks.
- Real MongoDB and network services were not connected. Existing storage/dispatch
  mechanics were tested with isolated SQLite and mocked service responses.
- Windows packaging, service installation, launch/stop behavior and a fresh Windows
  installation were not exercised. The desktop documentation still describes staged
  implementation; this QC does not create an all-in-one installer.
- User-authored custom text and global positive/negative library rules can contain
  arbitrary contradictions. Built-in behavior and selected regression combinations are
  checked; semantic validation of every possible custom sentence is not exhaustive.
- Retired Kink controls are suppressed in the active UI/compilation path, but legacy
  preset endpoints and historical lookup tables remain in the repository. This change
  does not delete existing records or retire that legacy API.
- Backend warnings concern the older FastAPI lifecycle registration and multipart
  import; build tooling emits a Node deprecation notice. These did not fail checks.

## Device checks after merge/rebuild

1. Choose two people and **holding hands**. Confirm the shared picker shows the choice;
   the final prompt contains the interaction once and no old hand-placement instruction.
2. Choose **one seated and one standing**, then a portrait crop. Confirm the audit marks
   the saved tight crop inactive and the render uses a wide shot.
3. Switch to Subject B and change framing. Confirm both people use the same camera crop.
4. Clear the shared pose and set separate body poses. Confirm each person keeps their
   own action while the camera remains shared.
5. Return the cast to one person. Confirm the shared interaction does not request a partner.
6. Enable Ollama internet access, refine a neutral prompt, and inspect retrieved sources.
   Disable it and verify subsequent requests remain local.
7. Start a render, select another result before polling completes, and confirm the old
   result cannot replace the newly selected thumbnail.
8. Render representative images for each installed model, then test gallery edits,
   capture, save/reopen, batch retry and an offline/reconnect cycle on disposable examples.
