import type { GameDoc, RiskId } from "../../../shared/types";

/* ============================ 过载强化（overload） ============================ */
/** 每层提供的全武器伤害加成 */
export const OVERLOAD_DAMAGE_BONUS = 0.25;
/** 每层提交时消耗的精英预算 */
export const OVERLOAD_ELITE_BUDGET_COST = 2;
/** 每层提高的精英出现率 */
export const OVERLOAD_ELITE_RATE = 0.04;
/** 每层让精英提早出现的波次数 */
export const OVERLOAD_ELITE_WAVE_EARLY = 1;

/* ============================ 加速成长（growth） ============================ */
/** 每层提供的拾取经验加成 */
export const GROWTH_XP_BONUS = 0.3;
/** 每层降低的装甲等级（代价） */
export const GROWTH_ARMOR_PENALTY = 1;

/* ============================== 精英预算（独立于敌潮生成预算） ============================== */
export const ELITE_BUDGET_INITIAL = 3;
export const ELITE_BUDGET_PER_WAVE = 2;
export const ELITE_BUDGET_MAX = 8;

/* 基础精英规则：未选择过载时与原 spawnEnemy 完全一致 */
export const BASE_ELITE_WAVE = 3;
export const BASE_ELITE_RATE = 0.08;
export const BASE_SHOOTER_RATE = 0.28;

/** 读取风险强化层级；旧数据缺省为 0，不影响原有升级数值 */
export const riskRank = (doc: GameDoc, id: RiskId): number =>
  doc.upgrades[id] || 0;

/** 全武器最终伤害倍率：原“高能增幅”规则保持不变，过载为独立乘区 */
export function weaponDamageMultiplier(doc: GameDoc): number {
  const power = 1 + (doc.upgrades.power || 0) * 0.2;
  const overload = 1 + riskRank(doc, "overload") * OVERLOAD_DAMAGE_BONUS;
  return power * overload;
}

/** 拾取经验倍率：仅加速成长影响，晶体本身的 value 不被修改 */
export function xpMultiplier(doc: GameDoc): number {
  return 1 + riskRank(doc, "growth") * GROWTH_XP_BONUS;
}

/** 有效装甲等级 = 纳米装甲层级 − 加速成长代价，不会低于 0 */
export function effectiveArmor(doc: GameDoc): number {
  return Math.max(
    0,
    (doc.upgrades.armor || 0) -
      riskRank(doc, "growth") * GROWTH_ARMOR_PENALTY,
  );
}

/** 实际伤害减免比例；无加速成长时与旧公式（armor × 12%）完全一致 */
export function damageReduction(doc: GameDoc): number {
  return Math.min(0.8, effectiveArmor(doc) * 0.12);
}

/** 精英最早出现波次：每层过载提早 1 波，最低第 1 波 */
export function eliteWaveThreshold(doc: GameDoc): number {
  return Math.max(
    1,
    BASE_ELITE_WAVE -
      riskRank(doc, "overload") * OVERLOAD_ELITE_WAVE_EARLY,
  );
}

/** 精英出现率：基础 8%，每层过载 +4% */
export function eliteSpawnRate(doc: GameDoc): number {
  return (
    BASE_ELITE_RATE + riskRank(doc, "overload") * OVERLOAD_ELITE_RATE
  );
}

/** 防御性读取精英预算，兼容缺省字段的旧文档 */
export function getEliteBudget(doc: GameDoc): number {
  return doc.eliteBudget ?? ELITE_BUDGET_INITIAL;
}

/** 过载候选是否可被当前精英预算承载 */
export function canAffordOverload(doc: GameDoc): boolean {
  return getEliteBudget(doc) >= OVERLOAD_ELITE_BUDGET_COST;
}

/** 波次推进时补充精英预算（仅在模拟步内调用，升级暂停不会触发） */
export function grantEliteBudget(doc: GameDoc): void {
  doc.eliteBudget = Math.min(
    ELITE_BUDGET_MAX,
    getEliteBudget(doc) + ELITE_BUDGET_PER_WAVE,
  );
}
