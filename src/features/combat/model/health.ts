import type { GameDoc } from "../../../shared/types";
import { damageReduction } from "../../progression/model/risk";
export function hurtPlayer(doc: GameDoc, damage: number): number {
  if (doc.player.invincible > 0 || doc.player.hp <= 0) return 0;
  // 有效装甲含加速成长的减级代价；无成长强化时与旧公式完全一致
  const taken = Math.min(doc.player.hp, Math.max(1, damage * (1 - damageReduction(doc))));
  doc.player.hp -= taken;
  doc.player.invincible = 0.65;
  return taken;
}
