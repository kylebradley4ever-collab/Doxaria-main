import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { playersTable, raidsTable, inventoryTable } from "@workspace/db/schema";
import {
  GOD_BOSSES,
  getGodByName,
  scaleGodForPlayer,
  rollRaidLoot,
  calcDamage,
} from "../lib/gameLogic.js";
import { getActivePetBonuses } from "./pets.js";
import { parseActivePotion } from "./alchemy.js";
import { eq, and, desc } from "drizzle-orm";
import { getPlayer } from "../lib/getPlayer.js";

const router: IRouter = Router();

const ATTACK_COOLDOWN_MS = 1_300;

router.get("/raids", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    const active = await db.select().from(raidsTable)
      .where(and(eq(raidsTable.playerId, player.id), eq(raidsTable.status, "active")))
      .limit(1);

    if (active.length) {
      res.json({ raid: active[0], gods: GOD_BOSSES, player });
      return;
    }

    const last = await db.select().from(raidsTable)
      .where(eq(raidsTable.playerId, player.id))
      .orderBy(desc(raidsTable.createdAt))
      .limit(1);

    res.json({ raid: last[0] ?? null, gods: GOD_BOSSES, player });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/raids/start", async (req, res) => {
  try {
    const { godName } = req.body as { godName: string };
    const god = getGodByName(godName);
    if (!god) { res.status(400).json({ error: "Unknown god" }); return; }

    const player = await getPlayer(req, res);
    if (!player) return;

    if (player.level < god.minLevel) {
      res.status(403).json({ error: `You must be level ${god.minLevel} to face ${god.name}.` });
      return;
    }

    const existing = await db.select().from(raidsTable)
      .where(and(eq(raidsTable.playerId, player.id), eq(raidsTable.status, "active")))
      .limit(1);
    if (existing.length) {
      res.status(409).json({ error: "You already have an active raid." });
      return;
    }

    const cooldownMs = god.cooldownMinutes * 60 * 1000;
    const recent = await db.select().from(raidsTable)
      .where(and(eq(raidsTable.playerId, player.id), eq(raidsTable.godName, godName)))
      .orderBy(desc(raidsTable.createdAt))
      .limit(1);
    if (recent.length && recent[0].completedAt) {
      const elapsed = Date.now() - new Date(recent[0].completedAt).getTime();
      if (elapsed < cooldownMs) {
        const remaining = Math.ceil((cooldownMs - elapsed) / 60000);
        res.status(429).json({ error: `${god.name} recovers — try again in ${remaining}m.`, remainingMinutes: remaining });
        return;
      }
    }

    const scaled = scaleGodForPlayer(god, player.level);
    const [raid] = await db.insert(raidsTable).values({
      playerId: player.id,
      godName: god.name,
      godHp: scaled.hp,
      godMaxHp: scaled.hp,
      godAttack: scaled.attack,
      godDefense: scaled.defense,
      phase: 1,
      isEnraged: false,
      status: "active",
      lootGranted: false,
    }).returning();

    res.json({ raid, gods: GOD_BOSSES, player });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/raids/attack", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    const raids = await db.select().from(raidsTable)
      .where(and(eq(raidsTable.playerId, player.id), eq(raidsTable.status, "active")))
      .limit(1);
    if (!raids.length) { res.status(404).json({ error: "No active raid" }); return; }
    let raid = raids[0];

    if (raid.lastAttackedAt) {
      const elapsed = Date.now() - new Date(raid.lastAttackedAt).getTime();
      if (elapsed < ATTACK_COOLDOWN_MS) {
        res.status(429).json({ error: "Attack too fast" });
        return;
      }
    }

    const god = getGodByName(raid.godName)!;
    const log: string[] = [];

    const petBonus    = getActivePetBonuses(player.petsData, player.activePetIndex);
    const activePotion = parseActivePotion(player.activePotionData);
    const potionAtkPct = activePotion?.effect?.atkBonus ?? 0;
    const potionDefPct = activePotion?.effect?.defBonus ?? 0;

    const playerAtk = player.attack  + petBonus.atkBonus + Math.floor(player.attack  * potionAtkPct / 100);
    const playerDef = player.defense + petBonus.defBonus + Math.floor(player.defense * potionDefPct / 100);
    const playerDmg = calcDamage(playerAtk, raid.godDefense);
    let newGodHp = Math.max(0, raid.godHp - playerDmg);
    log.push(`You strike ${raid.godName} for ${playerDmg} damage!`);

    let isEnraged = raid.isEnraged;
    let phase = raid.phase;
    const hpRatio = newGodHp / raid.godMaxHp;
    if (!isEnraged && hpRatio <= god.enrageThreshold) {
      isEnraged = true;
      phase = 2;
      log.push(`[ENRAGE] ${god.phaseMessage}`);
    }

    const effectiveGodAtk = isEnraged ? Math.floor(raid.godAttack * god.enrageMultiplier) : raid.godAttack;
    const godDmg = calcDamage(effectiveGodAtk, playerDef);
    const newPlayerHp = Math.max(0, player.hp - godDmg);
    log.push(`${raid.godName} retaliates for ${godDmg} damage!`);

    let status = raid.status as string;
    let loot: null | Awaited<ReturnType<typeof rollRaidLoot>> = null;

    if (newGodHp <= 0) {
      status = "victory";
      log.push(`Victory! You have defeated ${raid.godName}, ${god.title}!`);
      log.push(`A divine relic has been added to your inventory!`);
      loot = rollRaidLoot(raid.godName);
      await db.insert(inventoryTable).values({
        playerId: player.id,
        name: loot.name,
        rarity: loot.rarity,
        emoji: loot.emoji,
        goldValue: loot.goldValue,
        type: loot.type,
        statBonus: loot.statBonus,
        equipped: false,
        slot: null,
      });
      await db.update(playersTable)
        .set({ gold: player.gold + loot.goldValue, gearLooted: player.gearLooted + 1 })
        .where(eq(playersTable.id, player.id));
      await db.update(raidsTable)
        .set({ godHp: 0, phase, isEnraged, status, lootGranted: true, lastAttackedAt: new Date(), completedAt: new Date() })
        .where(eq(raidsTable.id, raid.id));
    } else if (newPlayerHp <= 0) {
      status = "defeated";
      log.push(`${raid.godName} has defeated you! You collapse before a god...`);
      const healedHp = Math.floor(player.maxHp * 0.2);
      await db.update(playersTable).set({ hp: healedHp }).where(eq(playersTable.id, player.id));
      await db.update(raidsTable)
        .set({ godHp: newGodHp, phase, isEnraged, status, lastAttackedAt: new Date(), completedAt: new Date() })
        .where(eq(raidsTable.id, raid.id));
    } else {
      await db.update(playersTable).set({ hp: newPlayerHp }).where(eq(playersTable.id, player.id));
      await db.update(raidsTable)
        .set({ godHp: newGodHp, phase, isEnraged, lastAttackedAt: new Date() })
        .where(eq(raidsTable.id, raid.id));
    }

    const [updatedRaid] = await db.select().from(raidsTable).where(eq(raidsTable.id, raid.id));
    const [updatedPlayer] = await db.select().from(playersTable).where(eq(playersTable.id, player.id));

    res.json({ raid: updatedRaid, player: updatedPlayer, log, loot, playerDamage: playerDmg, godDamage: godDmg });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/raids/flee", async (req, res) => {
  try {
    const player = await getPlayer(req, res);
    if (!player) return;

    await db.update(raidsTable)
      .set({ status: "fled", completedAt: new Date() })
      .where(and(eq(raidsTable.playerId, player.id), eq(raidsTable.status, "active")));

    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
