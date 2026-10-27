import type { Response, Request } from "express";
import e from "express";

export async function handleCreateUser(req: Request, res: Response) {}

export async function handleLoginUser(req: Request, res: Response) {}

export async function handleUpdateUser(req: Request<{ id: number }>, res: Response) {}

export async function handleDeleteUser(req: Request<{ id: number }>, res: Response) {}
