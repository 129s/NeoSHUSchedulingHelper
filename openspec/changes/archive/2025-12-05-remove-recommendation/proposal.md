# Change: Remove recommendation scoring and rules from filters/UI

## Why
- Current filter/sort config includes a “recommended” sort and related rule hooks that are unwanted.
- User explicitly wants to eliminate the recommendation system and associated rule baggage from frontend and config.

## What Changes
- Remove the “recommended” sort option and any recommendation-specific scoring logic from filter engines.
- Drop rule-based recommendation hooks from configs/stores/components.
- Keep simple, transparent filter/sort options only.

## Impact
- Specs: `rules-tools` (remove recommendation rule), possibly filter config references.
- Code: selection filters config, filter engine scoring, toolbar options; any UI references to “智能推荐/推荐排序”.
