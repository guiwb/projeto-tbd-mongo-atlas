import { Router } from "express";
import { asyncHandler } from "../utils.js";
import * as c from "../controllers/books.controller.js";

const router = Router();

router.get("/", asyncHandler(c.list));
router.get("/:id", asyncHandler(c.get));
router.post("/", asyncHandler(c.create));
router.patch("/:id/quantidade", asyncHandler(c.updateQuantity));
router.patch("/:id/categoria", asyncHandler(c.updateCategory));
router.delete("/:id", asyncHandler(c.remove));

export default router;
