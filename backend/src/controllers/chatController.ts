import type { Request, Response } from "express";
import * as chatService from "../services/chatService.js";

export async function ask(req: Request, res: Response): Promise<void> {
  res.json(await chatService.ask(req, req.body));
}
