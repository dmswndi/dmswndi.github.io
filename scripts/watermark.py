#!/usr/bin/env python3
"""
갤러리 이미지 우측 상단에 대각선 'eunjoo' 워터마크를 굽는다.

- 처리된 파일 목록은 images/gallery/.watermarked.txt (커밋됨)으로 추적
  → 이미 워터마크된 사진은 다시 처리하지 않음(이중 워터마크 방지)
- 깨끗한 원본은 images/gallery/_originals/ 에 로컬 백업(.gitignore로 비공개)
  → 공개 사이트에는 워터마크본만 노출됨
- 기본: 목록에 없는 '새 업로드'만 워터마크 (admin 자동 처리용)
- --all: 백업 원본 기준으로 전부 다시 굽기(수동 재처리용)

로컬(mac)·GitHub Actions(ubuntu) 폰트 자동 탐색.
"""
import os, sys, glob
from PIL import Image, ImageDraw, ImageFont

GAL = "images/gallery"
BAK = os.path.join(GAL, "_originals")          # 로컬 백업(비공개)
MARK = os.path.join(GAL, ".watermarked.txt")   # 처리 완료 목록(커밋)
TEXT = "eunjoo"
FORCE_ALL = "--all" in sys.argv

FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",   # Linux/Actions
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",      # macOS
    "/Library/Fonts/Arial.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf",
]
FONT_PATH = next((p for p in FONT_CANDIDATES if os.path.exists(p)), None)


def load_marker():
    if os.path.exists(MARK):
        with open(MARK, encoding="utf-8") as fh:
            return set(l.strip() for l in fh if l.strip())
    return set()


def save_marker(names):
    with open(MARK, "w", encoding="utf-8") as fh:
        fh.write("\n".join(sorted(names)) + "\n")


def make_watermark(W, H):
    fsize = max(18, int(W * 0.075))
    font = ImageFont.truetype(FONT_PATH, fsize) if FONT_PATH else ImageFont.load_default()
    measure = ImageDraw.Draw(Image.new("RGBA", (10, 10)))
    bbox = measure.textbbox((0, 0), TEXT, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = int(fsize * 0.6)
    txt = Image.new("RGBA", (tw + pad * 2, th + pad * 2), (0, 0, 0, 0))
    dt = ImageDraw.Draw(txt)
    ox, oy = pad - bbox[0], pad - bbox[1]
    sw = max(2, int(fsize * 0.06))
    dt.text((ox, oy), TEXT, font=font, fill=(255, 255, 255, 235),
            stroke_width=sw, stroke_fill=(0, 0, 0, 150))
    rot = txt.rotate(45, expand=True, resample=Image.BICUBIC)
    rw, rh = rot.size
    px = W - rw - int(W * 0.04)   # 우측 상단, 글자가 다 보이도록 약간 안쪽
    py = int(H * 0.04)
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    layer.paste(rot, (px, py), rot)
    return layer


def main():
    os.makedirs(BAK, exist_ok=True)
    done_set = load_marker()
    exts = ("*.jpg", "*.jpeg", "*.png", "*.JPG", "*.JPEG", "*.PNG")
    files = []
    for e in exts:
        files += glob.glob(os.path.join(GAL, e))
    files = sorted(set(files))

    done = 0
    for f in files:
        name = os.path.basename(f)
        if name in done_set and not FORCE_ALL:
            continue
        bak = os.path.join(BAK, name)
        # 깨끗한 원본 소스 결정: 백업이 있으면 그걸, 없으면 현재 파일(=업로드 직후 원본)
        if os.path.exists(bak):
            src = bak
        else:
            Image.open(f).save(bak)   # 최초 1회 원본 백업(로컬/비공개)
            src = bak
        base = Image.open(src).convert("RGBA")
        W, H = base.size
        out = Image.alpha_composite(base, make_watermark(W, H))
        ext = os.path.splitext(f)[1].lower()
        if ext in (".jpg", ".jpeg"):
            out.convert("RGB").save(f, quality=92)
        else:
            out.save(f)
        done_set.add(name)
        done += 1
        print("watermarked", name, f"{W}x{H}")

    save_marker(done_set)
    print(f"DONE {done} file(s). marker={len(done_set)} font={FONT_PATH or 'default'}")


if __name__ == "__main__":
    main()
