import { Router } from "express";
import { asyncHandler } from "../utils.js";
import * as c from "../controllers/loans.controller.js";

const router = Router();

router.get("/", asyncHandler(c.list));
router.post("/", asyncHandler(c.create));
router.patch("/:id/devolucao", asyncHandler(c.registerReturn));
router.patch("/:id/renovar", asyncHandler(c.renew));

export default router;
