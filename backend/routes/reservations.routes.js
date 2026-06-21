import { Router } from "express";
import { asyncHandler } from "../utils.js";
import * as c from "../controllers/reservations.controller.js";

const router = Router();

router.get("/", asyncHandler(c.list));
router.post("/", asyncHandler(c.create));
router.patch("/:id/finalizar", asyncHandler(c.finalize));
router.delete("/:id", asyncHandler(c.remove));

export default router;
