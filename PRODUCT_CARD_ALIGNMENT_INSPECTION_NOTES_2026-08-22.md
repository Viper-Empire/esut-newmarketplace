# Product-card alignment inspection notes

## Screenshot source

The supplied image is 1818×384 pixels with a 303:64 landscape ratio. It was inspected in four ordered horizontal crops with overlap.

## Crops 1–2 observations

The first two cards show a consistent outer-card boundary and a shared bottom edge, but their internal content does not reserve identical vertical space. The backpack card has a one-line title and its price row begins higher; the mathematics textbook card has a two-line title and its price row begins lower. The seller metadata and location rows therefore sit at different vertical positions between cards, while the Add to cart buttons are aligned near the same bottom baseline. The alignment problem is mainly an internal rhythm issue: the button is bottom-aligned, but title/price/meta blocks are not using stable row slots. The card width, rounded corners, heart control placement, and button width look consistent in these crops.

## Crops 3–4 observations

The scientific-calculator card confirms the one-line title case: its price, seller row, location row, and button all move upward relative to the two-line headphones card, while the card bottoms remain aligned. The headphones card has a two-line title and consequently lower price and metadata rows. The heart buttons remain consistently positioned at the top-right of each content area. The repeated pattern across all four cards confirms that the primary issue is inconsistent vertical rhythm caused by variable title and comparison-price content, not unequal card widths or broken horizontal orientation.
