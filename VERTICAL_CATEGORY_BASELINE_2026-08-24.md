# Food and Accommodation Category Baseline

Captured before the approved vertical foundation changes.

| Category ID | Current name | Current slug | Current state | Observed active listing relationship |
|---:|---|---|---|---|
| 5 | Hostel & Lodge | `hostel-home` | Active, featured, sort order 4 | Listing id 4, `Adjustable Study Lamp`, remains linked to category id 5. The record is a hostel/home essentials product, not accommodation inventory. |
| 6 | Food & Groceries | `food` | Active, featured, sort order 5 | No active homepage listing was returned under this category in the read-only check. |

The existing public marketplace response also confirmed the already-created `Digital Books & Courses` category id 30001 and the Engineering Mathematics listing id 3 remains linked to it.

## Preservation constraints

The rename must preserve category IDs, listing ownership, listing status, prices, inventory, media, and historical references. The active study-lamp listing must not be presented as an apartment, lodge, or accommodation unit. It should remain a general marketplace listing until a future explicit reclassification is approved.

The current category slugs are already used by public links and must remain compatibility paths. The intended canonical vertical entry routes are `/esutchop` for Food and `/accommodation` for student housing. Existing `/category/food` and `/category/hostel-home` links should redirect or resolve safely to the new canonical experiences after implementation.

No database mutation, provider change, custom-domain change, or new food/housing listing was performed while capturing this baseline.
