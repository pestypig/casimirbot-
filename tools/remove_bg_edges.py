#!/usr/bin/env python3
"""
remove_bg_edges.py

Batch background removal for PNGs using edge detection (Canny) to build a mask.
Outputs PNGs with transparency.

Modes:
  - largest-contour: uses edges -> biggest contour -> filled mask
  - grabcut: uses that mask to initialize GrabCut for refinement

Examples:
  python remove_bg_edges.py --input ./in --output ./out
  python remove_bg_edges.py --input image.png --output ./out --method grabcut --feather 2.0
  python remove_bg_edges.py --input ./in --output ./out --glob "*.png" --save-mask
"""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

import cv2
import numpy as np


def auto_canny_thresholds(gray: np.ndarray, sigma: float = 0.33) -> tuple[int, int]:
    """Pick Canny thresholds based on image median."""
    med = float(np.median(gray))
    lower = int(max(0, (1.0 - sigma) * med))
    upper = int(min(255, (1.0 + sigma) * med))
    # Avoid useless thresholds on very flat images
    if lower == upper:
        lower = max(0, lower - 10)
        upper = min(255, upper + 10)
    return lower, upper


def ensure_odd(k: int) -> int:
    """Make kernel size odd and >= 3 for Gaussian blur."""
    k = int(k)
    if k < 3:
        return 3
    return k if k % 2 == 1 else k + 1


def build_edge_mask(
    bgr: np.ndarray,
    blur: int,
    sigma: float,
    morph: int,
    canny_low: int | None,
    canny_high: int | None,
) -> np.ndarray:
    """
    Returns a binary-ish mask (uint8 0..255) based on edges and contour filling.
    """
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    blur_k = ensure_odd(blur)
    gray_blur = cv2.GaussianBlur(gray, (blur_k, blur_k), 0)

    if canny_low is None or canny_high is None:
        low, high = auto_canny_thresholds(gray_blur, sigma=sigma)
    else:
        low, high = int(canny_low), int(canny_high)

    edges = cv2.Canny(gray_blur, low, high)

    # Morphology to connect edge gaps and close shapes.
    mk = max(3, int(morph))
    if mk % 2 == 0:
        mk += 1
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (mk, mk))

    edges = cv2.dilate(edges, kernel, iterations=1)
    edges = cv2.morphologyEx(edges, cv2.MORPH_CLOSE, kernel, iterations=2)

    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    if not contours:
        # Fallback: try Otsu threshold if edges fail completely
        _, th = cv2.threshold(gray_blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return th

    # Choose largest contour by area
    contour = max(contours, key=cv2.contourArea)
    mask = np.zeros(gray.shape, dtype=np.uint8)
    cv2.drawContours(mask, [contour], contourIdx=-1, color=255, thickness=-1)

    # Clean up mask a bit
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, kernel, iterations=2)
    return mask


def refine_with_grabcut(
    bgr: np.ndarray,
    initial_mask_255: np.ndarray,
    iterations: int,
    border: int,
) -> np.ndarray:
    """
    Refine mask using GrabCut initialized from the edge-based mask.
    Returns uint8 mask 0..255.
    """
    h, w = initial_mask_255.shape[:2]

    # GrabCut mask labels
    gc = np.full((h, w), cv2.GC_PR_BGD, dtype=np.uint8)

    # Outside initial mask is background, inside is probable foreground
    gc[initial_mask_255 == 0] = cv2.GC_BGD
    gc[initial_mask_255 > 0] = cv2.GC_PR_FGD

    # Stronger "sure foreground": erode inside region
    mk = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (7, 7))
    sure_fg = cv2.erode(initial_mask_255, mk, iterations=2)
    gc[sure_fg > 0] = cv2.GC_FGD

    # Force a border region to be sure background (helps when subject touches edges)
    b = max(1, int(border))
    gc[:b, :] = cv2.GC_BGD
    gc[-b:, :] = cv2.GC_BGD
    gc[:, :b] = cv2.GC_BGD
    gc[:, -b:] = cv2.GC_BGD

    bgdModel = np.zeros((1, 65), np.float64)
    fgdModel = np.zeros((1, 65), np.float64)

    cv2.grabCut(bgr, gc, None, bgdModel, fgdModel, int(iterations), cv2.GC_INIT_WITH_MASK)

    out = np.where((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)
    return out


def apply_alpha(bgr: np.ndarray, new_alpha: np.ndarray, original_alpha: np.ndarray | None) -> np.ndarray:
    """
    Combine alpha channel (mask) with original alpha if present, return BGRA image.
    """
    alpha = new_alpha
    if original_alpha is not None:
        # Keep any existing transparency (don’t make transparent pixels opaque)
        alpha = cv2.min(alpha, original_alpha)

    return np.dstack([bgr, alpha]).astype(np.uint8)


def feather_mask(mask: np.ndarray, feather: float) -> np.ndarray:
    """
    Feather edges by blurring the mask; feather is sigma (float).
    """
    if feather <= 0:
        return mask
    # Use sigma-based blur; kernel size (0,0) lets OpenCV choose from sigma
    blurred = cv2.GaussianBlur(mask, (0, 0), float(feather))
    return blurred


def process_one(
    in_path: Path,
    out_dir: Path,
    method: str,
    blur: int,
    sigma: float,
    morph: int,
    feather: float,
    canny_low: int | None,
    canny_high: int | None,
    grabcut_iters: int,
    grabcut_border: int,
    invert: bool,
    save_mask: bool,
) -> None:
    img = cv2.imread(str(in_path), cv2.IMREAD_UNCHANGED)
    if img is None:
        raise RuntimeError(f"Could not read image: {in_path}")

    if img.ndim == 2:
        # Grayscale -> BGR
        bgr = cv2.cvtColor(img, cv2.COLOR_GRAY2BGR)
        orig_alpha = None
    elif img.shape[2] == 4:
        bgr = img[:, :, :3]
        orig_alpha = img[:, :, 3]
    else:
        bgr = img[:, :, :3]
        orig_alpha = None

    base_mask = build_edge_mask(
        bgr=bgr,
        blur=blur,
        sigma=sigma,
        morph=morph,
        canny_low=canny_low,
        canny_high=canny_high,
    )

    if method == "grabcut":
        mask = refine_with_grabcut(bgr, base_mask, iterations=grabcut_iters, border=grabcut_border)
    else:
        mask = base_mask

    if invert:
        mask = cv2.bitwise_not(mask)

    mask = feather_mask(mask, feather=feather)

    out_bgra = apply_alpha(bgr, mask, orig_alpha)

    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / in_path.name
    if not cv2.imwrite(str(out_path), out_bgra):
        raise RuntimeError(f"Failed writing output: {out_path}")

    if save_mask:
        mask_path = out_dir / f"{in_path.stem}_MASK.png"
        cv2.imwrite(str(mask_path), mask)


def iter_inputs(input_path: Path, glob_pattern: str) -> list[Path]:
    if input_path.is_file():
        return [input_path]

    if input_path.is_dir():
        # Use glob relative to directory
        return sorted(input_path.glob(glob_pattern))

    raise FileNotFoundError(f"Input path not found: {input_path}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Remove PNG backgrounds using edge detection + masking.")
    ap.add_argument("--input", required=True, help="Input file or directory")
    ap.add_argument("--output", required=True, help="Output directory")
    ap.add_argument("--glob", default="*.png", help='Glob when input is a directory (default: "*.png")')

    ap.add_argument("--method", choices=["largest-contour", "grabcut"], default="largest-contour",
                    help="Mask method (default: largest-contour)")
    ap.add_argument("--blur", type=int, default=5, help="Gaussian blur kernel size (odd; default: 5)")
    ap.add_argument("--sigma", type=float, default=0.33, help="Auto-Canny sigma (default: 0.33)")
    ap.add_argument("--morph", type=int, default=7, help="Morph kernel size (default: 7)")
    ap.add_argument("--feather", type=float, default=0.0, help="Feather mask edges (Gaussian sigma; default: 0)")

    ap.add_argument("--canny-low", type=int, default=None, help="Override Canny low threshold")
    ap.add_argument("--canny-high", type=int, default=None, help="Override Canny high threshold")

    ap.add_argument("--grabcut-iters", type=int, default=5, help="GrabCut iterations (default: 5)")
    ap.add_argument("--grabcut-border", type=int, default=8, help="Force border as background (default: 8 px)")

    ap.add_argument("--invert", action="store_true", help="Invert the final mask (swap fg/bg)")
    ap.add_argument("--save-mask", action="store_true", help="Also save the computed mask as a PNG")

    args = ap.parse_args()

    in_path = Path(args.input)
    out_dir = Path(args.output)

    inputs = iter_inputs(in_path, args.glob)
    if not inputs:
        print(f"No files matched in {in_path} with glob {args.glob}", file=sys.stderr)
        return 2

    failures = 0
    for p in inputs:
        try:
            process_one(
                in_path=p,
                out_dir=out_dir,
                method=args.method,
                blur=args.blur,
                sigma=args.sigma,
                morph=args.morph,
                feather=args.feather,
                canny_low=args.canny_low,
                canny_high=args.canny_high,
                grabcut_iters=args.grabcut_iters,
                grabcut_border=args.grabcut_border,
                invert=args.invert,
                save_mask=args.save_mask,
            )
            print(f"[ok] {p.name} -> {out_dir / p.name}")
        except Exception as e:
            failures += 1
            print(f"[err] {p}: {e}", file=sys.stderr)

    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
