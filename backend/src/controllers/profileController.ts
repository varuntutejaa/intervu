import type { Request, Response } from "express";
import * as profileService from "../services/profileService.js";

export async function get(req: Request, res: Response): Promise<void> {
  res.json(await profileService.getProfile(req));
}

export async function save(req: Request, res: Response): Promise<void> {
  res.json(await profileService.saveProfile(req, res, req.body));
}

export async function deleteResume(req: Request, res: Response): Promise<void> {
  res.json(await profileService.deleteResume(req));
}
