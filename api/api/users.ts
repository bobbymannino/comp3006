import type { Response, Request } from "express";
import type { AuthResponse } from "../auth.ts";

export async function handleCreateUser(req: Request, res: Response) {}

export async function handleLoginUser(req: Request, res: Response) {}

export async function handleUpdateUser(req: Request<{ id: string }>, res: AuthResponse) {}

export async function handleDeleteUser(req: Request<{ id: string }>, res: AuthResponse) {}
