export { stepProgression } from "./model/stepProgression";
export { chooseUpgrade, isUpgradeAvailable, rollChoices } from "./model/choices";
export { UPGRADE_CATALOG } from "./model/catalog";
export { previewChoices } from "./model/preview";
export type { ChoicePreview, PreviewStat } from "./model/preview";
export {
  weaponDamageMultiplier,
  xpMultiplier,
  effectiveArmor,
  damageReduction,
  eliteWaveThreshold,
  eliteSpawnRate,
  getEliteBudget,
  canAffordOverload,
  riskRank,
  ELITE_BUDGET_INITIAL,
  ELITE_BUDGET_PER_WAVE,
  ELITE_BUDGET_MAX,
  OVERLOAD_ELITE_BUDGET_COST,
  GROWTH_XP_BONUS,
  GROWTH_ARMOR_PENALTY,
  OVERLOAD_DAMAGE_BONUS,
} from "./model/risk";
export { xpRequired } from "./lib/experience";
export { UpgradeDialog } from "./ui/UpgradeDialog";
export { ExperienceBar } from "./ui/ExperienceBar";
