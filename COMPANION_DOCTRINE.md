# Sunshine / MANTA Constellation companion doctrine

Sunshine is a **visual exploration companion** for MANTAS. It is not a second system of record.

## Product boundary

- **Zen owns accepted mission meaning.**
- **Lens explains what, why, trace, and scoped proof.**
- **Sunshine visualizes evidence, candidates, accepted meaning, and projections.**
- **CoMET remains an external NOAA metadata authority/editor.**
- **OISS remains a downstream operational authority.**
- **STAC, ISO/GMI, DCAT, ACDD, and similar outputs are projections, not canonical truth stores.**

## Visual grammar

The default story is:

```text
SOURCE EVIDENCE
      ↓
   OBSERVED
      ↓
   CANDIDATE
      ↓
HUMAN DECISION
      ↓
     ZEN
   ↙  ↓  ↘
 ISO STAC CoMET/OISS
```

Not every object traverses every rung. External validation belongs on a separate scoped receipt path after projection/handoff.

## One selection = one story

The canvas should not attempt to display every node, label, score, source, projection, and finding simultaneously. A selection should emphasize:

1. selected object or relationship,
2. direct evidence,
3. direct semantic context,
4. relevant outward projections,
5. scoped assurance when it exists.

Everything else becomes quiet spatial context.

## Truth vocabulary

Use these labels consistently where applicable:

- `LIVE SOURCE`
- `OBSERVED`
- `LOCAL DERIVED`
- `CANDIDATE`
- `HUMAN DECISION`
- `ACCEPTED INTO ZEN`
- `LOCAL PROJECTION`
- `RECEIPT`
- `NOT_TESTED`
- `FIXTURE`

Avoid using `verified`, `pass`, `authoritative`, `confidence`, or probability-like percentages unless a real scoped contract justifies the term.

## AI boundary

AI is advisory. Search grounding can help locate evidence and suggest candidate metadata, but an AI response must not silently mutate accepted mission meaning or destination state.

AI suggestion flow:

```text
AI suggestion
  → candidate for review
  → evidence / source inspection
  → human decision
  → accepted meaning only when explicitly accepted
```

## MANTAS bridge direction

Sunshine should eventually consume a read-only MANTAS truth envelope instead of maintaining a competing canonical model.

Desired flow:

```text
manta-zen
  → read-only mission + assurance snapshot
  → Sunshine visual projection
  → selection / navigation only
```

Writes back to Zen, CoMET, or OISS require separate explicit contracts and are out of scope for the visual bridge.

## Lens

The companion Lens uses the same four human questions as MANTAS:

- **WHAT** — what object or accepted meaning am I looking at?
- **WHY** — what evidence and decisions support it?
- **TRACE** — where did it come from and where does it project?
- **PROVE IT** — what scoped checks or receipts actually exist, and what do they not prove?

Technical surfaces such as Evidence, Rosetta, XML, Signal, and destination adapters remain implementation/detail surfaces under those questions rather than competing top-level truth models.

## Hard rules

1. No silent external-source → canonical write.
2. No AI → canonical write without explicit human decision.
3. No CoMET validation claim without a real CoMET result.
4. No OISS PASS unless an authoritative OISS-scoped result exists.
5. A hash proves artifact identity/integrity, not semantic correctness.
6. A similarity/support calculation proposes relationships; it does not verify them.
7. Missing evidence remains missing; do not fabricate placeholder authority.
8. Sunshine may be visually ambitious without becoming a competing semantic engine.
