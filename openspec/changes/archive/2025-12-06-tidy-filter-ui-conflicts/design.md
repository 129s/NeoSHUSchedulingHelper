## Context
- Filter UI is now functional but cluttered (big buttons, unfolded language/week controls, duplicated inputs).
- Conflict filter semantics are ambiguous; need explicit “no filter” default and options aligned with solver diagnostics (conflic/impossible/weak-impossible).
- College/major options occasionally empty; need reliable source from dataset/crawler.
- Dependencies: `add-sport-language-flags`, `refactor-course-filters`, `align-solver-diagnostics`.

## Goals / Non-Goals
- Goals: compact UI; fold teaching language/模式 and week parity/span into dropdowns with checkboxes; clean up redundant inputs; explicit conflict options (无冲突/无conflic/无weak-impossible/无impossible, default no filter); ensure college/major options populate.
- Non-Goals: changing filter engine semantics beyond option cleanup; altering pagination.

## Decisions
- Conflict filter: default = 不过滤; options surface as explicit choices mapping to time-conflict (`conflic`) and solver diagnostics (`impossible`/`weak-impossible`); “无冲突” = exclude all conflicts; “无conflic/无weak-impossible/无impossible” map to excluding those labels.
- UI: shrink buttons/paddings; fold teaching language/模式 and week filters into dropdown panels with checkboxes/radio; remove duplicated inputs (keep canonical fields only).
- Data options: college/major pulled from dataset/taxonomy; handle missing by falling back to crawler snapshot.

## Risks / Mitigations
- Ambiguity of labels → align with `align-solver-diagnostics` labels; document mapping.
- Missing options → add fallback population from dataset snapshot if taxonomy is empty.
