import type { Request } from "express";
import { buildPaginated, parsePagination, type Paginated } from "../lib/pagination.js";
import { requireRole } from "../middleware/requireRole.js";
import { countCandidates, findCandidates } from "../repositories/candidatesRepository.js";

export async function listCandidates(req: Request): Promise<Paginated<unknown>> {
  await requireRole(req, "recruiter");

  const { page, pageSize, limit, offset } = parsePagination(req.query);
  const [items, total] = await Promise.all([findCandidates(limit, offset), countCandidates()]);
  return buildPaginated(items, total, page, pageSize);
}
