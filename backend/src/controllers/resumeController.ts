import type { Request, Response } from "express";
import * as resumeService from "../services/resumeService.js";

export async function parse(req: Request, res: Response): Promise<void> {
  res.json(await resumeService.parseResume(req, req.body));
}
