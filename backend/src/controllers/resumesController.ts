import type { Request, Response } from "express";
import * as resumesService from "../services/resumesService.js";

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await resumesService.list(req));
}

export async function getById(req: Request, res: Response): Promise<void> {
  res.json(await resumesService.getById(req, req.params.id));
}

export async function upload(req: Request, res: Response): Promise<void> {
  res.status(201).json(await resumesService.upload(req, req.body));
}

export async function replace(req: Request, res: Response): Promise<void> {
  res.json(await resumesService.replace(req, req.params.id, req.body));
}

export async function remove(req: Request, res: Response): Promise<void> {
  res.json(await resumesService.remove(req, req.params.id));
}
