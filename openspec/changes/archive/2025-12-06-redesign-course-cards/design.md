## Context
- Current course list/cards have weak hover and capacity cues; new design introduces a four-column card with a capacity ring.
- Color assignment already exists via `app/src/lib/utils/color.ts` (`colorFromHash`, `adjustHslColor`); reuse it and add contrast tweaks when adjacent colors are too similar.
- Course calendar uses clip-path styling; keep existing clip-path/shape while updating colors/hover states.
- Cross-campus is a global setting; cards show campus only when enabled. “可超额 / 拼手速” mode needs a term-based prompt.

## Goals / Non-Goals
- Goals: new card layout, ring thresholds, collapsed/expanded behavior, hover interactions, term-based prompt for 可超额/拼手速.
- Non-Goals: implementing solver logic or data changes; backend untouched.

## Decisions
- Capacity ring shows **remaining seats** (center number). Fill colors: ≤60% green; ≥75% or remaining ≤10 yellow; ≥80% or remaining ≤5 orange-red; 0 or overflow red. Overflow still renders ring; center shows 0 (no negative display).
- Collapsed groups hide ring and secondary fields (teacher/ID, campus); expanded reveals them. Hover uses existing hover treatment patterns.
- Group-level collapse applies to course name groups; variants with unique content still allow hover even when grouped.
- Color generation: reuse `colorFromHash` for base hue; adjust saturation/lightness via `adjustHslColor` when neighboring entries are too similar.
- Prompt: show “可超额/拼手速” modal on first visit per term; persist choice per term; can be changed in settings.

## Open Questions
- None.

## Risks / Mitigations
- Hover performance when many items: only register hover for selected/visible variants; lazy-load hover state for unselected collapsed groups; clean up listeners aggressively.
- Color clash: add contrast tweak when adjacent colors are too close in luminance/saturation.

## Migration Plan
- Update specs and UI components; keep calendar clip-path unchanged; add settings/persistence for the term-based prompt.
