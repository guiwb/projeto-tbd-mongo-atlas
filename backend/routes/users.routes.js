import { Router } from "express";
import { asyncHandler } from "../utils.js";
import * as c from "../controllers/users.controller.js";

const router = Router();

router.get("/", asyncHandler(c.list));
router.get("/:id", asyncHandler(c.get));
router.post("/", asyncHandler(c.create));
router.patch("/:id/bloquear", asyncHandler(c.block));
router.patch("/:id/reativar", asyncHandler(c.reactivate));
router.patch("/:id/curso", asyncHandler(c.updateCourse));

export default router;
