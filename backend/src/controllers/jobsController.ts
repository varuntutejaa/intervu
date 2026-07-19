import type { Request, Response } from "express";
import * as jobsService from "../services/jobsService.js";

export async function list(req: Request, res: Response): Promise<void> {
  res.json(await jobsService.list(req));
}

export async function trendingCompanies(req: Request, res: Response): Promise<void> {
  res.json(await jobsService.trendingCompanies(req));
}

export async function listMine(req: Request, res: Response): Promise<void> {
  res.json(await jobsService.listMine(req));
}

export async function stats(req: Request, res: Response): Promise<void> {
  res.json(await jobsService.stats(req));
}

export async function getById(req: Request, res: Response): Promise<void> {
  res.json(await jobsService.getById(req.params.id));
}

export async function create(req: Request, res: Response): Promise<void> {
  res.status(201).json(await jobsService.create(req, req.body));
}

export async function update(req: Request, res: Response): Promise<void> {
  res.json(await jobsService.update(req, req.params.id, req.body));
}

export async function listApplicants(req: Request, res: Response): Promise<void> {
  res.json(await jobsService.listApplicants(req, req.params.id));
}

export async function getApplicant(req: Request, res: Response): Promise<void> {
  res.json(await jobsService.getApplicant(req, req.params.id, req.params.applicationId));
}

export async function updateApplicant(req: Request, res: Response): Promise<void> {
  res.json(await jobsService.updateApplicant(req, req.params.id, req.params.applicationId, req.body));
}
