# Charles Form Integration Strategy

## Strategic pivot

Treat Charles's Google Form / Sheet as a first-class source contract into MANTAS, not as a competing UI and not as something MANTAS should replace.

The collaboration boundary is:

```text
CHARLES FORM
  structured collection owned by Charles
          |
          v
VERSIONED SOURCE CONTRACT
  charlie-google-form-v3
          |
          v
MANTAS ADAPTER
  observe -> preserve -> map to candidate paths
          |
          v
HUMAN REVIEW
  candidates do not silently become canonical
          |
          v
ZEN / UxSMission
  accepted mission meaning
          |
          v
PROJECTION TRACE
          |
          v
CODEX XML
          |
          v
COMET / downstream validators and destinations
```

## Product message for Charles

MANTAS should not define what his intake must collect. His form remains his operational intake surface and source contract. MANTAS should learn to consume that contract faithfully, preserve its provenance, surface ambiguities, and project accepted meaning into downstream metadata representations.

Primary line:

> I went back and modeled your form as a source contract instead of trying to make it conform to my UI. I don't think your form and MANTAS are alternative solutions. Your form is exactly the kind of authoritative intake contract MANTAS should learn to consume without taking ownership away from you.

## Existing Sunshine implementation to preserve

The repository already contains the right building blocks:

- `src/data/charlie-form-map.v1.json`
  - versioned `charlie-google-form-v3` field contract
  - 25 source columns mapped to canonical candidate paths
  - transforms are explicit
- `src/services/charlieAdapter.ts`
  - treats form values as observations/candidates
  - supports Signal-style field checks and XML regression comparison
- `src/components/CharlieIntakeWorkspace.tsx`
  - intake workbench
  - field-by-field candidate review
  - `Charlie <-> MANTAS XML Regression`
  - import of a Sheet row
- `WorkbenchShell` already pairs Charlie Intake with Accepted Mission.

Do not replace these with a second intake engine.

## Required UX change

The Charles meeting view should be intentionally narrow. Do not lead with the full Sunshine cockpit.

Default demo path:

```text
YOUR FORM -> MANTAS -> ACCEPTED MISSION -> CODEX XML
```

Hide or demote Knowledge Graph, map, Corpus, MANTAScript, generic AI chat, destination compare, and other advanced surfaces until Charles asks a question that requires them.

### Screen 1 - Your contract

Show:

- source profile: `charlie-google-form-v3`
- 25 source fields
- one selected source field
- source value
- explicit transform
- canonical candidate path
- state: observed / candidate / accepted / unresolved

Copy:

> This is your field contract. MANTAS observes it; it does not silently rewrite it.

### Screen 2 - One field end to end

Preferred examples:

- title
- platform
- instrument
- custodian email
- bounding box

Show one trace:

```text
Charles source field
  -> observed source value
  -> transform
  -> canonical candidate path
  -> human decision when required
  -> accepted Zen field
  -> ProjectionTrace
  -> Codex XML node
```

Do not show every subsystem at once.

### Screen 3 - XML regression

Make `Charlie <-> MANTAS XML Regression` the collaboration surface, not a pass/fail judgment.

Prompt the discussion with:

> Where does my interpretation stop matching what you intended?

Classify differences as:

- source contract difference
- transform difference
- canonical mapping difference
- projection difference
- expected downstream requirement
- unresolved / needs domain decision

Avoid framing the comparison as Charles's form being wrong.

### Screen 4 - Conflict only when useful

If two sources disagree, reveal the deeper MANTAS value:

```text
Charles Form claim
        +
ISO / inventory / DocuComp / authority evidence
        |
        v
candidate comparison
        |
        v
HumanDecision
        |
        v
Zen
```

Key message:

> Trust rank may help order evidence, but MANTAS does not silently choose between genuine conflicting claims.

## Charles ownership boundary

Charles owns:

- the source form / sheet workflow
- field collection intent
- source labels and operational meaning
- decisions about what belongs in the intake contract

MANTAS owns:

- adapter interpretation of the versioned contract
- preservation of source evidence
- candidate mapping to canonical paths
- conflict/reconciliation workflow
- HumanDecision provenance
- downstream projections
- validator receipts and projection freshness

CoMET / OISS / other systems retain their own validation and execution authority.

## Contract versioning rule

Never hard-wire the application around "Charlie" as a permanent special case.

Use a generic source-profile concept with Charles's current profile as the first proven specimen:

```text
SourceProfile
  id: charlie-google-form-v3
  version: 1.0.0
  fields: SourceFieldRule[]
```

If Charles changes the form:

1. create a new profile version;
2. preserve prior mappings for old submissions;
3. run regression against representative rows;
4. explicitly review changed mappings;
5. do not reinterpret historical observations silently.

Longer-term naming can become `FormContractAdapter` / `SourceProfileAdapter`, with `charlie-google-form-v3` as one profile.

## Important implementation corrections

### Remove "Accept All Candidates" from the collaboration demo

Batch acceptance is too easy to misread as silent promotion of observed form values into truth. Keep acceptance field-level or require an explicit reviewed batch decision with clear provenance.

### Do not let AI directly update Zen

AI may explain or suggest candidate changes. A suggested update must remain a proposal until existing HumanDecision / review machinery accepts it.

### Preserve source values

Editing a candidate in the workbench must not mutate the original imported artifact. Store any edited interpretation separately from the original observation.

### Regression is not validation

`Charlie <-> MANTAS XML Regression` compares representations. It does not establish XSD, Schematron, CoMET, archive, or OISS acceptance.

### No synthetic identifiers

Do not invent UUIDs, accession IDs, DOI, DocuComp identities, GCMD concept URIs, or destination receipts in the Charles path.

## Meeting choreography

### Opening

> What clicked for me after looking at your form is that I don't think we're building competing solutions. You're solving structured collection. I'm working on what happens after that evidence arrives: preserving what you meant, reconciling it with other evidence, and projecting accepted meaning into the downstream representations.

### Demo

1. Open Charles source profile.
2. Pick one field.
3. Show source field -> candidate path.
4. Accept/review the field if appropriate.
5. Show accepted mission value.
6. Jump directly to the corresponding Codex XML node.
7. Open XML regression for that field.
8. Ask Charles whether the interpretation matches his intent.

### Ask

> I mapped these fields the way I think you mean them. I'd rather have you tell me where I'm wrong. If we can make one versioned adapter faithfully represent your form, we've proved a repeatable integration pattern.

### Close

> If we can prove your Form -> accepted mission -> CoMET XML without losing provenance or silently changing meaning, then we have a pattern that can work for other intake systems too.

## Definition of done for the Charles collaboration path

- [ ] `charlie-google-form-v3` loads as an explicit versioned source profile.
- [ ] Original source observations remain immutable.
- [ ] One field can be traced source -> candidate -> decision -> Zen -> ProjectionTrace -> Codex XML.
- [ ] Field selection drives the relevant accepted mission field and Codex node.
- [ ] XML regression is field-focused and descriptive, not a global score.
- [ ] Missing mappings remain missing.
- [ ] Genuine conflicts require HumanDecision.
- [ ] No batch acceptance is exposed in the default Charles demo.
- [ ] No AI action silently mutates Zen.
- [ ] Advanced graph/corpus/workbench features are hidden from the default Charles path.
- [ ] CoMET/OISS claims remain bounded to actual receipts.

## Success condition

Charles should leave the session seeing MANTAS as an integration layer that strengthens and extends his existing intake workflow, not as a replacement for it.
