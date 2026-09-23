# Mobile app design request

_Started 2026-09-23 06:26 UTC_

---

## User

Design a mobile app for

## Assistant

_[tool: list_files]_

_[tool: list_files]_

_[tool: read_file]_

_[tool: read_file]_

## Assistant

## Assistant

## Assistant

## Assistant

I'll build this in chunks: logic + shell first, then each screen.

_[tool: dc_write]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: show_html]_

_[tool: dc_html_str_replace]_

Now variant B and toast.

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: show_html]_

_[tool: dc_html_str_replace]_

_[tool: dc_html_str_replace]_

_[tool: dc_js_str_replace]_

_[tool: run_script]_

_[tool: read_file]_

_[tool: run_script]_

_[tool: delete_file]_

_[tool: show_html]_

_[tool: ready_for_verification]_

I built two files:

- **Khata.dc.html** is the clickable prototype. It covers setup, the overview, logging an expense with undo, insights, category detail (including merge, subcategories and quick amounts) and settings. A list on the left jumps to any screen and switches between the two logging interactions.
- **Khata Frames.dc.html** has the static frames: every screen, the edge states, and the steps of both logging interactions side by side.

The two logging interactions:
- **A (keypad first):** you type the amount and the category you use most is already picked. You then check a review screen before saving.
- **B (category first):** you tap a big emoji tile first. The next screen shows that category's quick amounts, and the save button spells out exactly what will be filed and where.

A few things to review:
- **Wants budget:** it isn't a separate number. In Settings you tick which categories count as Wants, and their budgets add up to the Wants budget.
- **Warning colours:** the design system has no yellow or red, so I added an amber and a carmine that fit its palette.
- **Demo data:** July is treated as the first month, so Insights shows the "nothing to compare yet" state there. There's also a scenario where the Wants budget has run out.

A background check of the prototype is still running and will flag anything broken.

