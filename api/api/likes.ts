import type { Request } from "express";
import type { AuthResponse } from "../auth.ts";

export async function handleCreateLike(req: Request<{ id: string }>, res: AuthResponse) {}

export async function handleDeleteLike(req: Request<{ id: string }>, res: AuthResponse) {}
