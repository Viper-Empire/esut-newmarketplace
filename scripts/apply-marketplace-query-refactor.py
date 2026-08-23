from pathlib import Path

router_path = Path("server/routers.ts")
block_path = Path("scripts/optimized-marketplace-search-block.txt")
text = router_path.read_text()
start_marker = "search: publicProcedure"
end_marker = "suggestions: publicProcedure"
start = text.find(start_marker)
end = text.find(end_marker, start)
if start < 0 or end < 0 or end <= start:
    raise SystemExit("Marketplace search procedure boundaries were not found")
replacement = block_path.read_text()
new_text = text[:start] + replacement + text[end:]
router_path.write_text(new_text)
print("Replaced public marketplace search procedure internals: 1")
