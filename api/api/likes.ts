import type { Request, Response } from "express";

export async function handleCreateLike(req: Request<{ id: number }>, res: Response) {}

export async function handleDeleteLike(req: Request<{ id: number }>, res: Response) {}
