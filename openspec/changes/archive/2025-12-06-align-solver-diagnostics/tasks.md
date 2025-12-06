## 1. Planning
- [x] 1.1 Review existing solver/constraint outputs and UI conflict handling to locate where diagnostics are emitted and displayed.
- [x] 1.2 Identify persistence points for solver results (auto vs user) and term signatures.

## 2. Design & Spec
- [x] 2.1 Finalize label taxonomy (`conflic`, `impossible`, `weak-impossible`) and reason payload format.
- [x] 2.2 Define dual-state storage (auto feasibility vs manual solver) with metadata (term, signature, timestamp).
- [x] 2.3 Plan UI hover/tooltip integration for diagnostics, independent of filter modes.

## 3. Implementation
- [x] 3.1 Update constraint builders/solver outputs to emit canonical labels + reasons; ensure persistence for both auto/manual states.
- [x] 3.2 Add UI surfaces (hover/tooltips) to show diagnostics; keep conflict filters unchanged but allow badges for impossible/weak-impossible.
- [x] 3.3 Persist term/signature metadata with both solver states; expose in UI state store.

## 4. Validation
- [x] 4.1 Run `openspec validate align-solver-diagnostics --strict`.
- [x] 4.2 Manual check: diagnostics labeling, hover display, separate auto/manual records with correct term signatures.
