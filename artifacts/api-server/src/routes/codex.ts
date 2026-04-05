import { Router } from "express";
import { db } from "@workspace/db";
import { playersTable } from "@workspace/db/schema";
import { getPlayer } from "../lib/getPlayer.js";

const router = Router();

export interface CodexEntry {
  name: string;
  kills: number;
  emoji: string;
}

export function parseCodex(data: string | null | undefined): Record<string, number> {
  if (!data) return {};
  try { return JSON.parse(data); } catch { return {}; }
}

export function updateCodex(existing: Record<string, number>, monsterName: string): Record<string, number> {
  return { ...existing, [monsterName]: (existing[monsterName] || 0) + 1 };
}

router.get("/codex", async (req, res) => {
  const p = await getPlayer(req, res);
  if (!p) return;
  const codex = parseCodex(p.monsterCodex);
  const entries = Object.entries(codex)
    .map(([name, kills]) => ({ name, kills }))
    .sort((a, b) => b.kills - a.kills);
  res.json({ entries, total: entries.length });
});

export default router;
