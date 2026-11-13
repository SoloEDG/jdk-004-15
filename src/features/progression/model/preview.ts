import type { GameDoc } from "../../../shared/types";
import { UPGRADE_CATALOG } from "./catalog";
import {
  damageReduction,
  eliteSpawnRate,
  eliteWaveThreshold,
  effectiveArmor,
  weaponDamageMultiplier,
  xpMultiplier,
} from "./risk";

export interface PreviewStat {
  label: string;
  before: string;
  after: string;
  direction: "up" | "down" | "flat";
}

export interface ChoicePreview {
  id: string;
  name: string;
  category: string;
  levelLabel: string;
  description: string;
  isRisk: boolean;
  benefits: string[];
  costs: string[];
  stats: PreviewStat[];
}

const pct = (v: number) => `${Math.round(v * 100)}%`;

/**
 * 候选预览：全部数据由当前战场状态纯函数派生，
 * 不会修改 doc（不消耗精英预算、不生成敌人、不动晶体与玩家数值）。
 * 多个待选等级依次提交后，doc 已更新，再次调用本函数自然反映已提交效果。
 */
export function previewChoices(doc: GameDoc): ChoicePreview[] {
  return doc.choices.map((id) => {
    const upgrade = UPGRADE_CATALOG.find((u) => u.id === id);
    if (!upgrade) {
      return {
        id,
        name: "紧急修复",
        category: "补给",
        levelLabel: "无代价",
        description: "回复 30 点生命",
        isRisk: false,
        benefits: ["立即回复 30 点生命"],
        costs: [],
        stats: [
          {
            label: "生命",
            before: `${Math.ceil(doc.player.hp)}`,
            after: `${Math.min(doc.player.maxHp, Math.ceil(doc.player.hp) + 30)}`,
            direction: "up",
          },
        ],
      };
    }
    const rank = doc.upgrades[id] || 0;
    const isRisk = Boolean(upgrade.risk);
    const levelLabel =
      upgrade.max === Infinity
        ? "无代价"
        : `Lv.${rank} → Lv.${rank + 1}${isRisk ? " · 风险" : ""}`;
    const benefits: string[] = [];
    const costs: string[] = [];
    const stats: PreviewStat[] = [];
    const beforeDmg = weaponDamageMultiplier(doc);
    const beforeXp = xpMultiplier(doc);
    const beforeArmor = effectiveArmor(doc);
    const beforeReduction = damageReduction(doc);

    switch (id) {
      case "overload":
        benefits.push(upgrade.risk!.benefit);
        costs.push(upgrade.risk!.cost);
        stats.push({
          label: "武器伤害倍率",
          before: pct(beforeDmg),
          after: pct(beforeDmg + 0.25 * beforeDmg),
          direction: "up",
        });
        stats.push({
          label: "精英出现波次",
          before: `第 ${eliteWaveThreshold(doc)} 波起`,
          after: `第 ${Math.max(1, eliteWaveThreshold(doc) - 1)} 波起`,
          direction: "down",
        });
        stats.push({
          label: "精英出现率",
          before: pct(eliteSpawnRate(doc)),
          after: pct(eliteSpawnRate(doc) + 0.04),
          direction: "down",
        });
        break;
      case "growth":
        benefits.push(upgrade.risk!.benefit);
        costs.push(upgrade.risk!.cost);
        stats.push({
          label: "经验获取倍率",
          before: pct(beforeXp),
          after: pct(beforeXp + 0.3),
          direction: "up",
        });
        stats.push({
          label: "有效装甲",
          before: `${beforeArmor} 级（减伤 ${pct(beforeReduction)}）`,
          after: `${Math.max(0, beforeArmor - 1)} 级（减伤 ${pct(
            Math.min(0.8, Math.max(0, beforeArmor - 1) * 0.12),
          )}）`,
          direction: "down",
        });
        break;
      default:
        benefits.push(upgrade.description);
        if (id === "pulse" || id === "orbit" || id === "nova") {
          stats.push({
            label: "武器等级",
            before: `Lv.${rank}`,
            after: `Lv.${rank + 1}`,
            direction: "up",
          });
        }
        if (id === "power") {
          stats.push({
            label: "武器伤害倍率",
            before: pct(beforeDmg),
            after: pct(beforeDmg + 0.2),
            direction: "up",
          });
        }
        if (id === "armor") {
          stats.push({
            label: "伤害减免",
            before: pct(beforeReduction),
            after: pct(Math.min(0.8, beforeReduction + 0.12)),
            direction: "up",
          });
        }
        if (id === "speed") {
          stats.push({
            label: "移动速度",
            before: `${Math.round(doc.player.speed)}`,
            after: `${Math.round(doc.player.speed * 1.12)}`,
            direction: "up",
          });
        }
        if (id === "vitality") {
          stats.push({
            label: "生命上限",
            before: `${doc.player.maxHp}`,
            after: `${doc.player.maxHp + 20}`,
            direction: "up",
          });
        }
        if (id === "haste") {
          stats.push({
            label: "射速",
            before: pct(1 + (doc.upgrades.haste || 0) * 0.13),
            after: pct(1 + ((doc.upgrades.haste || 0) + 1) * 0.13),
            direction: "up",
          });
        }
        if (id === "magnet") {
          stats.push({
            label: "拾取范围",
            before: `${65 + (doc.upgrades.magnet || 0) * 35}px`,
            after: `${65 + ((doc.upgrades.magnet || 0) + 1) * 35}px`,
            direction: "up",
          });
        }
        if (id === "pierce") {
          stats.push({
            label: "脉冲穿透",
            before: `${doc.upgrades.pierce || 0} 个目标`,
            after: `${(doc.upgrades.pierce || 0) + 1} 个目标`,
            direction: "up",
          });
        }
        break;
    }
    return {
      id,
      name: upgrade.name,
      category: upgrade.category,
      levelLabel,
      description: upgrade.description,
      isRisk,
      benefits,
      costs,
      stats,
    };
  });
}
