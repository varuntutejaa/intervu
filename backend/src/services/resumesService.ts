import type { Request } from "express";
import { badRequest, forbidden, notFound } from "../lib/httpError.js";
import { requireRole } from "../middleware/requireRole.js";
import * as resumesRepo from "../repositories/resumesRepository.js";
import { uploadResumeSchema } from "../schemas/resumeSchemas.js";

function parseId(rawId: string): number {
  const id = Number(rawId);
  if (!Number.isInteger(id)) throw badRequest("Invalid resume id.");
  return id;
}

async function requireOwnedResume(id: number, candidateSub: string): Promise<void> {
  const owner = await resumesRepo.findResumeOwner(id);
  if (owner === undefined) throw notFound("Resume not found.");
  if (owner !== candidateSub) throw forbidden("That's not your resume.");
}

export async function list(req: Request) {
  const user = await requireRole(req, "candidate");
  return resumesRepo.findResumesForCandidate(user.sub);
}

export async function getById(req: Request, rawId: string) {
  const user = await requireRole(req, "candidate");
  const id = parseId(rawId);
  await requireOwnedResume(id, user.sub);
  return resumesRepo.findResumeById(id);
}

export async function upload(req: Request, rawInput: unknown): Promise<{ id: number }> {
  const user = await requireRole(req, "candidate");
  const input = uploadResumeSchema.parse(rawInput);
  const id = await resumesRepo.insertResume(user.sub, input.filename, input.data);
  return { id };
}

export async function replace(req: Request, rawId: string, rawInput: unknown): Promise<{ status: string }> {
  const user = await requireRole(req, "candidate");
  const id = parseId(rawId);
  await requireOwnedResume(id, user.sub);

  const input = uploadResumeSchema.parse(rawInput);
  await resumesRepo.replaceResume(id, input.filename, input.data);
  return { status: "replaced" };
}

export async function remove(req: Request, rawId: string): Promise<{ status: string }> {
  const user = await requireRole(req, "candidate");
  const id = parseId(rawId);
  await requireOwnedResume(id, user.sub);

  await resumesRepo.deleteResume(id, user.sub);
  return { status: "deleted" };
}
