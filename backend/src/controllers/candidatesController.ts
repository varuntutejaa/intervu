import type { Request, Response } from "express";
import { listCandidates } from "../services/candidatesService.js";

export async function list(req: Request, res: Response): Promise<void> {
  const result = await listCandidates(req);
  res.json(result);
}
