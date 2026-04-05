import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import type { Player } from "@workspace/db/schema";

export async function getPlayer(req: Request, res: Response): Promise<Player | null> {
  const token = req.headers["x-player-token"];
  if (!token || typeof token !== "string") {
    res.status(401).json({ error: "Missing player token. Please create a character first." });
    return null;
  }
  const [player] = await db.select().from(playersTable).where(eq(playersTable.token, token));
  if (!player) {
    res.status(404).json({ error: "Player not found. Please create a character first." });
    return null;
  }
  return player;
}
