import type { GameDoc } from "../../../shared/types";
import { xpMultiplier } from "../model/risk";
export const xpRequired = (level: number): number => 12 + (level - 1) * 7;
export function grantExperience(doc: GameDoc, value: number): void {
  // 加速成长只缩放入账经验，地上晶体的 value 保持原值不变
  doc.xp += value * xpMultiplier(doc);
  while (doc.xp >= xpRequired(doc.level)) {
    doc.xp -= xpRequired(doc.level);
    doc.level++;
    doc.pendingLevels++;
  }
}
