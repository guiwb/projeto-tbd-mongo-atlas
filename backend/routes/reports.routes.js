import { Router } from "express";
import { asyncHandler } from "../utils.js";
import * as c from "../controllers/reports.controller.js";

const router = Router();

router.get("/dashboard", asyncHandler(c.dashboard));
router.get("/livros-populares", asyncHandler(c.popularBooks));
router.get("/usuario/:id", asyncHandler(c.userReport));

export default router;
