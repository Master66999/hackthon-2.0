import os, cv2, numpy as np
from pathlib import Path

_THIS_DIR    = Path(__file__).resolve().parent
_PROJECT_DIR = _THIS_DIR.parent.parent

DATASET_DIR = _PROJECT_DIR / "public" / "images"
_SKIP_STEMS = {"hero_leaf"}
_STEM_TO_CROP = {
    "apple":    "Apple",
    "cotton":   "Cotton",
    "tea":      "Tea",
    "tomato":   "Tomato",
    "maize":    "Maize",
    "coffee":   "Coffee",
    "hibiscus": "Hibiscus",
}
_IMG_EXTS = {".png", ".jpg", ".jpeg", ".bmp", ".webp"}
_REFERENCE_CACHE = None

def _load_reference_images():
    refs = []
    if not DATASET_DIR.exists():
        print("[Matcher] Dataset dir not found:", DATASET_DIR)
        return refs
    for f in sorted(DATASET_DIR.iterdir()):
        if f.suffix.lower() not in _IMG_EXTS:
            continue
        stem = f.stem.lower()
        if stem in _SKIP_STEMS:
            continue
        crop = _STEM_TO_CROP.get(stem)
        if crop is None:
            for key, val in _STEM_TO_CROP.items():
                if stem.startswith(key):
                    crop = val
                    break
        if crop is None:
            crop = stem.replace("_", " ").title()
        img = cv2.imread(str(f))
        if img is None:
            print("[Matcher] Could not read:", f.name)
            continue
        refs.append({"path": f, "crop": crop, "bgr": img})
        print("[Matcher] Registered ->", f.name, "->", crop)
    return refs

def _get_references():
    global _REFERENCE_CACHE
    if _REFERENCE_CACHE is None:
        _REFERENCE_CACHE = _load_reference_images()
    return _REFERENCE_CACHE

def _orb_score(img_gray, ref_gray):
    orb = cv2.ORB_create(nfeatures=500)
    kp1, des1 = orb.detectAndCompute(img_gray, None)
    kp2, des2 = orb.detectAndCompute(ref_gray, None)
    if des1 is None or des2 is None or len(des1) < 4 or len(des2) < 4:
        return 0.0
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
    matches = bf.match(des1, des2)
    if not matches:
        return 0.0
    good = [m for m in matches if m.distance < 60]
    return min(len(good) / max(min(len(kp1), len(kp2)), 1), 1.0)

def _hist_score(img_bgr, ref_bgr):
    def hsv_hist(bgr):
        hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
        h = cv2.calcHist([hsv], [0], None, [64], [0, 180])
        s = cv2.calcHist([hsv], [1], None, [64], [0, 256])
        cv2.normalize(h, h); cv2.normalize(s, s)
        return np.concatenate([h.flatten(), s.flatten()])
    h1 = hsv_hist(img_bgr); h2 = hsv_hist(ref_bgr)
    dist = cv2.compareHist(h1.reshape(-1,1), h2.reshape(-1,1), cv2.HISTCMP_BHATTACHARYYA)
    return max(0.0, 1.0 - dist)

_PATCH_SIZE = (128, 128)

def _patch_score(img_bgr, ref_bgr):
    def patch(bgr):
        return cv2.cvtColor(cv2.resize(bgr, _PATCH_SIZE), cv2.COLOR_BGR2GRAY).astype(np.float32)
    result = cv2.matchTemplate(patch(img_bgr), patch(ref_bgr), cv2.TM_CCOEFF_NORMED)
    return max(0.0, float(np.max(result)))

def identify_crop_by_dataset(uploaded_bgr):
    refs = _get_references()
    if not refs:
        return {"crop": "Unknown", "confidence": 0.0, "best_match": None,
                "all_scores": [], "method": "Dataset Image Similarity Matching"}
    W = (400, 400)
    up = cv2.resize(uploaded_bgr, W)
    ug = cv2.cvtColor(up, cv2.COLOR_BGR2GRAY)
    all_scores = []
    for ref in refs:
        rr = cv2.resize(ref["bgr"], W)
        rg = cv2.cvtColor(rr, cv2.COLOR_BGR2GRAY)
        so = _orb_score(ug, rg)
        sh = _hist_score(up, rr)
        sp = _patch_score(up, rr)
        ens = so*0.40 + sh*0.35 + sp*0.25
        all_scores.append({"filename": ref["path"].name, "crop": ref["crop"],
            "orb": round(so*100,1), "hist": round(sh*100,1),
            "patch": round(sp*100,1), "ensemble": round(ens*100,1)})
        print("[Matcher]", ref["path"].name, "ORB=", round(so*100,1),
              "Hist=", round(sh*100,1), "Patch=", round(sp*100,1), "Ens=", round(ens*100,1))
    all_scores.sort(key=lambda x: x["ensemble"], reverse=True)
    crop_totals = {}
    for s in all_scores:
        crop_totals[s["crop"]] = max(crop_totals.get(s["crop"], 0.0), s["ensemble"])
    best_crop  = max(crop_totals, key=crop_totals.get)
    best_score = crop_totals[best_crop]
    best_file  = all_scores[0]["filename"]
    print("[Matcher] Best ->", best_crop, best_score, "via", best_file)
    return {"crop": best_crop, "confidence": round(best_score, 1),
            "best_match": best_file, "all_scores": all_scores,
            "method": "Dataset Image Similarity Matching"}
