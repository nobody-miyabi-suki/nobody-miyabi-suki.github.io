from pathlib import Path
from xml.etree.ElementTree import Element, SubElement, ElementTree

BASE_URL = "https://miyabi-suki.xyz"

ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "sitemap.xml"

EXCLUDE_DIRS = {
    ".git",
    ".github",
    "node_modules",
    "auth",
}

EXCLUDE_FILES = {
    "404.html",
}

urls = []

for file in ROOT.rglob("*.html"):
    relative = file.relative_to(ROOT)

    if any(part in EXCLUDE_DIRS for part in relative.parts):
        continue

    if file.name in EXCLUDE_FILES:
        continue

    path = relative.as_posix()

    if path == "index.html":
        url = BASE_URL + "/"
    elif path.endswith("/index.html"):
        url = BASE_URL + "/" + path[:-10]
    else:
        url = BASE_URL + "/" + path

    urls.append(url)

urls = sorted(set(urls))

urlset = Element(
    "urlset",
    {
        "xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9"
    }
)

for url in urls:
    url_element = SubElement(urlset, "url")
    loc = SubElement(url_element, "loc")
    loc.text = url

tree = ElementTree(urlset)

try:
    ElementTree.indent(tree, space="    ")
except AttributeError:
    pass

tree.write(
    OUTPUT,
    encoding="utf-8",
    xml_declaration=True
)

print(f"Sitemap generated successfully!")
print(f"Found {len(urls)} HTML pages.")
print(f"Saved to: {OUTPUT}")