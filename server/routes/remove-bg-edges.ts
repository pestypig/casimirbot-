import { Router } from "express";
import multer from "multer";
import { removeBackgroundEdges } from "../services/remove-bg-edges";

export const removeBgEdgesRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

removeBgEdgesRouter.post("/", upload.single("image"), async (req, res) => {
  try {
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file?.buffer) {
      return res.status(400).json({ error: "image_required" });
    }

    const methodRaw = typeof req.body?.method === "string" ? req.body.method.trim() : undefined;
    const method = methodRaw === "grabcut" ? "grabcut" : "largest-contour";
    const blur = Number.isFinite(Number(req.body?.blur)) ? Number(req.body.blur) : undefined;
    const sigma = Number.isFinite(Number(req.body?.sigma)) ? Number(req.body.sigma) : undefined;
    const morph = Number.isFinite(Number(req.body?.morph)) ? Number(req.body.morph) : undefined;
    const feather = Number.isFinite(Number(req.body?.feather)) ? Number(req.body.feather) : undefined;
    const cannyLow = Number.isFinite(Number(req.body?.cannyLow ?? req.body?.canny_low))
      ? Number(req.body.cannyLow ?? req.body.canny_low)
      : undefined;
    const cannyHigh = Number.isFinite(Number(req.body?.cannyHigh ?? req.body?.canny_high))
      ? Number(req.body.cannyHigh ?? req.body.canny_high)
      : undefined;
    const grabcutBorder = Number.isFinite(Number(req.body?.grabcutBorder ?? req.body?.grabcut_border))
      ? Number(req.body.grabcutBorder ?? req.body.grabcut_border)
      : undefined;
    const invert =
      req.body?.invert === "1" ||
      req.body?.invert === "true" ||
      req.body?.invert === true ||
      req.body?.invert === "on";

    const output = await removeBackgroundEdges(file.buffer, file.originalname || "image.png", {
      method,
      blur,
      sigma,
      morph,
      feather,
      cannyLow,
      cannyHigh,
      grabcutBorder,
      invert,
    });

    res.setHeader("Content-Type", "image/png");
    res.setHeader("X-Remove-Bg-Method", method);
    res.send(output);
  } catch (error: any) {
    const message = error instanceof Error ? error.message : String(error);
    const missingCv2 =
      typeof message === "string" &&
      (message.includes("No module named 'cv2'") || message.toLowerCase().includes("module named cv2"));
    const payload = missingCv2
      ? {
          error: "missing_cv2",
          message:
            "Python env is missing OpenCV. Install dependencies: pip install opencv-python numpy. If using a venv, set REMOVE_BG_PYTHON_BIN to its python.",
        }
      : { error: "remove_bg_failed", message };
    console.error("[remove-bg-edges] failed", error);
    res.status(missingCv2 ? 503 : 500).json(payload);
  }
});
