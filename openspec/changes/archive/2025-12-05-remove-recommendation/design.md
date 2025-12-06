## Context
- Selection filters config currently includes a `recommended` sort option and scoring that penalizes rule flags (capacityFull, selectionForbidden, etc.).
- There is no desire to keep any recommendation-like behavior; only straightforward sorts/filters should remain.
- Pre-alpha: focus on removing recommendation logic; no backward compatibility needed for this removal.

## Decisions
- Remove `recommended` sort option from config and UI; set default sort to a simple deterministic field (e.g., courseCode or time).
- Remove recommendation scoring function and associated penalties from filter engine.
- Clean up any rule/registry hooks tied to recommendation or “智能推荐” labels.
- Keep other limit rules intact (capacity/forbidden/etc.)—only recommendation logic is removed.

## Open Questions
- Desired default sort after removal (propose courseCode or remainingCapacity).
- Any downstream consumers expecting a recommended score? Plan: none; verify via code search.
