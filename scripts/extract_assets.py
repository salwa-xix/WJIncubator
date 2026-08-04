#!/usr/bin/env python3
"""
Extract the real image assets from the two source PDFs.

Produces:
  public/assets/mentors/<slug>.png          mentor portraits
  public/assets/mentors/<slug>-org<N>.png   organisation logos
  public/assets/startups/<slug>.png         startup logos
  public/assets/startups/<slug>-founder.png founder portraits
  supabase/seed/06_asset_urls.sql           UPDATE statements wiring them up

Card positions were verified against the rendered pages rather than guessed:
each deck lays its cards on a fixed x-grid, and cards read right-to-left, so a
portrait is assigned to a mentor by its x-centre. Organisation logos sit in a
lower band and attach to whichever card centre they are nearest.

Requires PyMuPDF:  pip install pymupdf

  python3 scripts/extract_assets.py <startups.pdf> <mentors.pdf>
"""
import os
import sys

import fitz

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_M = os.path.join(ROOT, "public", "assets", "mentors")
OUT_S = os.path.join(ROOT, "public", "assets", "startups")
SEED = os.path.join(ROOT, "supabase", "seed", "06_asset_urls.sql")

# Mentor cards per page, ordered by x-centre DESCENDING (rightmost first).
#
# Derived from the position of each name's text span in the PDF, not assumed:
# the deck does not lay its cards out consistently. Pages 1 and 4 read
# right-to-left, pages 2 and 3 read left-to-right. Guessing a single direction
# silently mismatched eight portraits to the wrong mentors.
#
# Card x-centres are identical on every full page: 1225 / 889 / 552 / 216.
MENTOR_PAGES = [
    ["basma-khoja", "anas-alsufyani", "abduljawad-chowdhry", "abdullah-nobar"],
    ["yazeed-almutairi", "abdullah-alqahtani", "khalid-alkhudair", "muna-balhamar"],
    ["amin-ramadan", "ahmed-alzubairi", "mohammed-almashjari", "sultan-alzahoufi"],
    ["omran-yousef", "adel-alsaedi"],
]

# Startup profile slides, one per page, in page order.
STARTUP_PAGES = [
    "mabien", "nanoclean", "groupz", "mustahaq", "thella", "senoz-ai",
    "wound-care-ai", "dithar", "medirect", "juthoor", "stetholink",
    "cartiheal", "phagetech", "aquanova", "plstka", "hader", "evinex",
    "oprato", "floraex",
]

PAGE_W = 1440.0


def save(doc, xref, path):
    """Write an embedded image, flattening any alpha onto white."""
    pix = fitz.Pixmap(doc, xref)
    if pix.n - pix.alpha >= 4:            # CMYK → RGB
        pix = fitz.Pixmap(fitz.csRGB, pix)
    if pix.alpha:
        bg = fitz.Pixmap(pix.colorspace, pix.irect, False)
        bg.clear_with(255)
        pix = fitz.Pixmap(bg, pix)
    pix.save(path)
    return os.path.getsize(path)


def content_images(page):
    """Images that are actual content, not the full-bleed background bands."""
    out = []
    for info in page.get_image_info(xrefs=True):
        x0, y0, x1, y1 = info["bbox"]
        if info["xref"] == 0 or (x1 - x0) > 900:
            continue
        out.append({"xref": info["xref"], "x0": x0, "y0": y0, "x1": x1, "y1": y1,
                    "cx": (x0 + x1) / 2, "w": x1 - x0, "h": y1 - y0})
    return out


def main():
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    startups_pdf, mentors_pdf = sys.argv[1], sys.argv[2]
    os.makedirs(OUT_M, exist_ok=True)
    os.makedirs(OUT_S, exist_ok=True)
    updates, total = [], 0

    # ---------------- mentors ----------------
    doc = fitz.open(mentors_pdf)
    for pi, slugs in enumerate(MENTOR_PAGES):
        imgs = content_images(doc[pi])
        # Portraits sit in a narrow upper band and are roughly square. The
        # width cap matters: the decorative header band and the one wide
        # organisation logo printed at portrait height would both otherwise
        # pass as portraits and shift every card's assignment by one.
        portraits = sorted(
            [i for i in imgs if 200 < i["y0"] < 320 and 100 < i["w"] < 260],
            key=lambda i: -i["cx"])
        # Logos sit in a lower band, above the page's bottom decoration.
        # An xref that also appears up in the portrait band is a decorative
        # element reused inside the card, not an organisation mark.
        upper_xrefs = {i["xref"] for i in imgs if i["y0"] < 320}
        logos = [i for i in imgs
                 if 520 <= i["y0"] <= 640 and i["xref"] not in upper_xrefs]

        centres = {}
        for slug, port in zip(slugs, portraits):
            total += save(doc, port["xref"], os.path.join(OUT_M, f"{slug}.png"))
            centres[slug] = port["cx"]
            updates.append(
                f"update public.mentors set image_url = '/assets/mentors/{slug}.png' "
                f"where slug = '{slug}';")

        if len(portraits) != len(slugs):
            print(f"  ! page {pi+1}: {len(portraits)} portraits for {len(slugs)} mentors")

        # Attach each logo to the nearest card centre, keeping print order.
        buckets = {s: [] for s in slugs}
        for lg in logos:
            nearest = min(centres, key=lambda s: abs(centres[s] - lg["cx"]))
            buckets[nearest].append(lg)
        for slug, group in buckets.items():
            for n, lg in enumerate(sorted(group, key=lambda i: -i["cx"]), start=1):
                name = f"{slug}-org{n}.png"
                total += save(doc, lg["xref"], os.path.join(OUT_M, name))
                updates.append(
                    f"update public.mentor_organizations set org_logo_url = "
                    f"'/assets/mentors/{name}' where mentor_id = "
                    f"(select id from public.mentors where slug = '{slug}') and sort_order = {n};")
    doc.close()

    # ---------------- startups ----------------
    doc = fitz.open(startups_pdf)
    for pi, slug in enumerate(STARTUP_PAGES):
        imgs = content_images(doc[pi])
        # The decorative band is drawn twice per slide, once at each corner, and
        # is wide enough to satisfy a naive x-position test — hence the explicit
        # vertical window and width cap on both.
        founder = [i for i in imgs
                   if i["cx"] > PAGE_W * 0.75 and 200 < i["y0"] < 500 and i["w"] < 300]
        logo = [i for i in imgs
                if i["cx"] < PAGE_W * 0.5 and 80 < i["w"] < 400 and 250 < i["y0"] < 650]

        if founder:
            total += save(doc, founder[0]["xref"], os.path.join(OUT_S, f"{slug}-founder.png"))
        if logo:
            total += save(doc, logo[0]["xref"], os.path.join(OUT_S, f"{slug}.png"))
            updates.append(
                f"update public.startups set logo_url = '/assets/startups/{slug}.png' "
                f"where slug = '{slug}';")
        else:
            # CartiHeal's mark is set in type on the slide, not placed as an
            # image. Left NULL rather than substituting something invented.
            print(f"  ! no logo image on the {slug} slide — leaving logo_url NULL")
    doc.close()

    with open(SEED, "w", encoding="utf-8") as fh:
        fh.write("-- ============================================================\n"
                 "-- SEED — asset URLs\n"
                 "-- ============================================================\n"
                 "-- Generated by scripts/extract_assets.py from the source PDFs.\n"
                 "-- Do not edit by hand; re-run the script instead.\n"
                 "--\n"
                 "-- Paths are app-relative (public/assets/...). Point them at\n"
                 "-- Supabase Storage instead by changing the prefix here.\n"
                 "-- ============================================================\n\n")
        fh.write("\n".join(updates) + "\n")

    print(f"extracted {len(updates)} assets, {total/1024/1024:.1f} MB")
    print(f"wrote {os.path.relpath(SEED, ROOT)}")


if __name__ == "__main__":
    main()
