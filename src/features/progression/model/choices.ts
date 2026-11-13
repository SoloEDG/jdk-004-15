import type { GameDoc, Upgrade, WeaponId } from "../../../shared/types";
import { random } from "../../../shared/math";
import { UPGRADE_CATALOG } from "./catalog";
import {
  OVERLOAD_ELITE_BUDGET_COST,
  canAffordOverload,
  getEliteBudget,
} from "./risk";

/** 候选是否仍可选择：满级排除；过载还要求精英预算能够承载 */
export function isUpgradeAvailable(doc: GameDoc, upgrade: Upgrade): boolean {
  if (upgrade.id === "recovery") return true;
  if ((doc.upgrades[upgrade.id] || 0) >= upgrade.max) return false;
  if (upgrade.risk?.id === "overload" && !canAffordOverload(doc))
    return false;
  return true;
}

/**
 * 刷新三选一候选。本函数只读取战场状态、不修改任何战斗/物资字段，
 * 因此预览期间不会提前消耗精英预算，也不会触碰地上的晶体。
 */
export function rollChoices(doc: GameDoc): void {
  const available = UPGRADE_CATALOG.filter((u) =>
    isUpgradeAvailable(doc, u),
  ).map((u) => u.id);
  for (let i = available.length - 1; i > 0; i--) {
    const j = Math.floor(random(doc) * (i + 1));
    [available[i], available[j]] = [available[j], available[i]];
  }
  doc.choices = available.slice(0, 3);
  // Every finite upgrade is eventually exhausted; a recovery choice keeps queued levels spendable.
  if (!doc.choices.length) doc.choices = ["recovery"];
  doc.choiceRound = (doc.choiceRound || 0) + 1;
  doc.phase = "upgrade";
}

export function chooseUpgrade(doc: GameDoc, id: string): void {
  if (
    doc.phase !== "upgrade" ||
    !doc.choices.includes(id) ||
    doc.pendingLevels <= 0
  )
    return;
  // 同一候选轮次只接受一次提交，快速双击的第二次直接忽略
  if (doc.choiceRound > 0 && doc.lastChosenRound === doc.choiceRound) return;
  if (id === "recovery") {
    doc.player.hp = Math.min(doc.player.maxHp, doc.player.hp + 30);
  } else {
    const definition = UPGRADE_CATALOG.find((u) => u.id === id);
    if (!definition || !isUpgradeAvailable(doc, definition)) return;
    if (id === "overload") {
      // 提交时才真正扣除精英预算；预算不足则该候选应已被排除
      if (getEliteBudget(doc) < OVERLOAD_ELITE_BUDGET_COST) return;
      doc.eliteBudget = getEliteBudget(doc) - OVERLOAD_ELITE_BUDGET_COST;
    }
    doc.upgrades[id] = (doc.upgrades[id] || 0) + 1;
    if (id === "speed") doc.player.speed += 190 * 0.12;
    if (id === "vitality") {
      doc.player.maxHp += 20;
      doc.player.hp = Math.min(doc.player.maxHp, doc.player.hp + 20);
    }
    if (id === "pulse" || id === "orbit" || id === "nova") {
      const weapon = doc.weapons.find((w) => w.id === id);
      if (weapon) weapon.level++;
      else doc.weapons.push({ id: id as WeaponId, level: 1, cooldown: 0 });
    }
    // 风险强化（overload / growth）只写入层级，其代价与收益均为派生值，
    // 从下一模拟步开始被各系统读取，此处不直接改动战场、晶体或生成预算。
  }
  doc.lastChosenRound = doc.choiceRound;
  doc.pendingLevels--;
  doc.choices = [];
  if (doc.pendingLevels > 0) rollChoices(doc);
  else {
    doc.phase = "playing";
    doc.notice = "升级完成 · 继续战斗";
  }
}
