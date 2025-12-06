## ADDED Requirements
### Requirement: Course cards show actions and solver intent hooks
Course cards MUST expose actions for joining wishlist/selected and for adding solver intents: clearly labeled “必选” (add hard constraint, group=must-pick-one) and “排除”/“不选班次” (exclude section). For single-section groups, “必选” locks that section; for multi-section groups, “必选” sets group to pick exactly one and can open include/exclude selection. Buttons A/B (必选/排除) follow the common list-template style used across lists.

#### Scenario: Group constraint actions
- **WHEN** a card represents a group (collapsed or expanded)
- **THEN** it shows intent buttons; “必” adds hard must-pick-one, “不选” excludes selected section(s), and changes propagate to the solver lists.

### Requirement: Include/Exclude micro selection on lists
Course/group list rows MUST provide a lightweight include/exclude affordance: a small square checkbox to mark a section or group as focused for intent editing. Tapping A/B buttons maps to include (必选) and exclude states; tapping again clears the state. Already-marked items MUST show a clear/cancel affordance so users can return to neutral.

#### Scenario: Toggle include/exclude
- **WHEN** a user taps the small selector on a course row
- **THEN** it cycles neutral → include (必选) → exclude (排除) → neutral, reflecting state in the solver intent lists and allowing cancel from the list or solver tab.

### Requirement: Solver tab applies direction/priority after selection
Checkbox selection on course rows only marks candidates; the solver tab main content (same column as lists, no side panel) MUST provide direction (包含/排除) and priority (硬/软) pickers before adding to the constraint list. The shared filter/template presents the two action buttons to apply the choice.

#### Scenario: Apply selected items to constraints
- **WHEN** a user selects rows via checkboxes and opens the solver panel
- **THEN** they can choose include/exclude + hard/soft, apply via the two buttons, and the resulting intents appear in the solver lists.

### Requirement: Rule list controls positioning
The rule list (constraint list) MUST surface a compact checkbox column per row and place the direction/priority controls in the header/control bar above the list. Controls include two buttons (添加/取消) and toggles for 包含/排除 and 硬/软; applying updates the selected rows, cancelling resets them to neutral.

#### Scenario: Use header controls
- **WHEN** rows are selected
- **THEN** the user sets 包含/排除 + 硬/软 in the header controls and clicks 添加 to apply, or 取消 to clear the selections.
