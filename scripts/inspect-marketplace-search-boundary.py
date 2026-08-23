from pathlib import Path
text = Path("server/routers.ts").read_text()
start = text.find("search: publicProcedure")
end = text.find("suggestions: publicProcedure", start)
print("start", start, "end", end)
print(repr(text[start:end]))
