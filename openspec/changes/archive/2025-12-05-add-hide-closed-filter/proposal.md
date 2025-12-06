# Change: Add filter toggle to hide closed/停开 classes by default

## Why
- Crawler/parser now capture `classStatus` (停开) but UI/filters do not use it.
- Need a default filter to hide停开班级 while keeping a toggle to show them when needed.

## What Changes
- Add a selection filter flag for classStatus to hide停开班级 by default.
- Provide a user-facing toggle/config to reveal停开班级 when desired (frontend follow-up implementation).

## Impact
- Specs: `rules-tools` (filters/rule registry), possibly filter config docs.
- Code: selection filters configuration and any rule/filter utilities; frontend display change will happen in a later implementation stage.
