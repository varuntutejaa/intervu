import type { Request, Response } from "express";
import * as applicationsService from "../services/applicationsService.js";

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await applicationsService.list(req));
}

export async function notifications(req: Request, res: Response): Promise<void> {
  res.json(await applicationsService.notifications(req));
}

export async function create(req: Request, res: Response): Promise<void> {
  res.status(201).json(await applicationsService.create(req, req.body));
}

export async function update(req: Request, res: Response): Promise<void> {
  res.json(await applicationsService.update(req, req.params.id, req.body));
}

export async function withdraw(req: Request, res: Response): Promise<void> {
  res.json(await applicationsService.withdraw(req, req.params.id));
}

export async function remove(req: Request, res: Response): Promise<void> {
  res.json(await applicationsService.remove(req, req.params.id));
}
