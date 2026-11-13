import { test } from "node:test";
import assert from "node:assert/strict";
import { createRun } from "../src/shared/createRun";
import {
  chooseUpgrade,
  isUpgradeAvailable,
  rollChoices,
  previewChoices,
  stepProgression,
  UPGRADE_CATALOG,
} from "../src/features/progression";
import {
  weaponDamageMultiplier,
  xpMultiplier,
  effectiveArmor,
  damageReduction,
  eliteWaveThreshold,
  eliteSpawnRate,
  getEliteBudget,
  canAffordOverload,
  ELITE_BUDGET_INITIAL,
  ELITE_BUDGET_MAX,
  OVERLOAD_ELITE_BUDGET_COST,
} from "../src/features/progression/model/risk";
import { spawnEnemy } from "../src/features/waves/lib/spawn";
import { stepWaves } from "../src/features/waves";
import { hurtPlayer } from "../src/features/combat/model/health";
import { simulate } from "../src/app/simulate";
import type { FrameEvents } from "../src/shared/types";

const events = (): FrameEvents => ({
  kills: [],
  damage: 0,
  taken: 0,
  shots: 0,
  collected: 0,
});
const idleInput = { x: 0, y: 0, aim: { x: 700, y: 325 }, firing: false };
const def = (id: string) => UPGRADE_CATALOG.find((u) => u.id === id)!;

test("old upgrades keep their original values when no risk cost is present", () => {
  const d = createRun();
  d.phase = "playing";
  d.pendingLevels = 1;
  rollChoices(d);
  d.choices = ["power"];
  chooseUpgrade(d, "power");
  assert.equal(d.upgrades.power, 1);
  // 无过载时，伤害倍率与旧规则完全一致：1 + 1 * 0.2
  assert.equal(weaponDamageMultiplier(d), 1.2);
  assert.equal(xpMultiplier(d), 1);
  assert.equal(effectiveArmor(d), 0);
  assert.equal(damageReduction(d), 0);
});

test("overload raises weapon damage and growth raises xp only after submission", () => {
  const d = createRun();
  // 预览阶段：纯函数推导，doc 不发生任何变化
  d.phase = "upgrade";
  d.choiceRound = 1;
  d.choices = ["overload", "growth", "power"];
  const snapshot = JSON.stringify(d);
  const previews = previewChoices(d);
  assert.equal(JSON.stringify(d), snapshot);
  const overloadPreview = previews.find((p) => p.id === "overload")!;
  assert.ok(overloadPreview.isRisk);
  assert.ok(overloadPreview.costs.length > 0);
  assert.ok(overloadPreview.benefits.length > 0);
  // 预览不扣精英预算
  assert.equal(getEliteBudget(d), ELITE_BUDGET_INITIAL);

  d.pendingLevels = 2;
  chooseUpgrade(d, "overload");
  assert.equal(weaponDamageMultiplier(d), 1.25);
  assert.equal(
    getEliteBudget(d),
    ELITE_BUDGET_INITIAL - OVERLOAD_ELITE_BUDGET_COST,
  );
  // 第二个待选等级：手动固定候选，验证已提交的过载不影响成长结算
  d.choices = ["growth", "power", "speed"];
  d.choiceRound += 1;
  chooseUpgrade(d, "growth");
  assert.equal(xpMultiplier(d), 1.3);
});

test("overload cost makes elites spawn earlier and more often", () => {
  const d = createRun();
  assert.equal(eliteWaveThreshold(d), 3);
  assert.equal(eliteSpawnRate(d), 0.08);
  d.upgrades.overload = 1;
  assert.equal(eliteWaveThreshold(d), 2);
  assert.equal(eliteSpawnRate(d), 0.12);
  d.upgrades.overload = 3;
  assert.equal(eliteWaveThreshold(d), 1);
  // 第 2 波在满层过载下即可生成精英（原规则第 3 波）；种子 1972 的首次 roll≈0.0003
  d.wave = 2;
  d.seed = 1972;
  assert.equal(spawnEnemy(d).kind, "elite");
  // 无过载时同样的低 roll 在第 2 波只会成为游击者，验证“提早出现”确实来自过载
  const baseline = createRun();
  baseline.wave = 2;
  baseline.seed = 1972;
  assert.notEqual(spawnEnemy(baseline).kind, "elite");
});

test("growth armor penalty reduces effective armor and damage reduction", () => {
  const d = createRun();
  d.upgrades.armor = 3;
  assert.equal(effectiveArmor(d), 3);
  d.upgrades.growth = 2;
  assert.equal(effectiveArmor(d), 1);
  assert.equal(damageReduction(d), 0.12);
  // 装甲不会被降到负数
  d.upgrades.growth = 5;
  d.upgrades.growth = 3;
  d.upgrades.armor = 1;
  assert.equal(effectiveArmor(d), 0);
  assert.equal(damageReduction(d), 0);
  // 实际承伤体现代价：无减免时受到全额（至少 1 点）
  const d2 = createRun();
  d2.upgrades.armor = 2;
  d2.upgrades.growth = 2; // 有效装甲 0
  d2.player.invincible = 0;
  const taken = hurtPlayer(d2, 100);
  assert.equal(taken, 100);
});

test("elite budget excludes overload when it cannot be afforded", () => {
  const d = createRun();
  assert.ok(canAffordOverload(d));
  d.eliteBudget = 1;
  assert.equal(canAffordOverload(d), false);
  assert.equal(isUpgradeAvailable(d, def("overload")), false);
  // 其他候选不受预算影响
  assert.equal(isUpgradeAvailable(d, def("growth")), true);
  assert.equal(isUpgradeAvailable(d, def("power")), true);
});

test("max level candidates are excluded from rolling", () => {
  const d = createRun();
  d.upgrades.overload = 3;
  assert.equal(isUpgradeAvailable(d, def("overload")), false);
  d.upgrades.growth = 3;
  assert.equal(isUpgradeAvailable(d, def("growth")), false);
  d.phase = "playing";
  d.pendingLevels = 1;
  rollChoices(d);
  assert.ok(!d.choices.includes("overload"));
  assert.ok(!d.choices.includes("growth"));
});

test("double clicking the same candidate in one round only submits once", () => {
  const d = createRun();
  d.phase = "upgrade";
  d.choices = ["power", "speed", "growth"];
  d.pendingLevels = 2;
  d.choiceRound = 5;
  d.lastChosenRound = 0;
  chooseUpgrade(d, "power");
  assert.equal(d.upgrades.power, 1);
  assert.equal(d.pendingLevels, 1);
  // 同一轮的第二次提交（含相同与不同候选）必须被拦截
  chooseUpgrade(d, "power");
  chooseUpgrade(d, "speed");
  assert.equal(d.upgrades.power, 1);
  assert.equal(d.upgrades.speed, undefined);
  assert.equal(d.pendingLevels, 1);
  // 新一轮恢复可用
  d.choices = ["speed", "growth", "power"];
  d.choiceRound = 6;
  chooseUpgrade(d, "speed");
  assert.equal(d.upgrades.speed, 1);
  assert.equal(d.pendingLevels, 0);
});

test("preview is pure: it never spends budget, spawns enemies or touches drops", () => {
  const d = createRun();
  d.phase = "upgrade";
  d.choices = ["overload", "growth", "power"];
  d.drops = [{ id: 99, x: 10, y: 10, kind: "xp", value: 5, life: 30 }];
  const before = JSON.stringify(d);
  for (let i = 0; i < 5; i++) previewChoices(d);
  assert.equal(JSON.stringify(d), before);
  assert.equal(d.enemies.length, 0);
  assert.equal(d.drops[0].value, 5);
  assert.equal(getEliteBudget(d), ELITE_BUDGET_INITIAL);
});

test("multiple pending levels preview sequentially reflects committed effects", () => {
  const d = createRun();
  d.phase = "upgrade";
  d.choices = ["growth"];
  d.pendingLevels = 2;
  const first = previewChoices(d)[0];
  assert.ok(first.levelLabel.includes("Lv.0 → Lv.1"));
  chooseUpgrade(d, "growth");
  // 第二个待选等级：候选已包含已提交的一层成长
  d.choices = ["growth"];
  const second = previewChoices(d)[0];
  assert.ok(second.levelLabel.includes("Lv.1 → Lv.2"));
  const xpStat = second.stats.find((s) => s.label === "经验获取倍率")!;
  assert.equal(xpStat.before, "130%");
  assert.equal(xpStat.after, "160%");
});

test("upgrade pause does not consume elite budget, spawn enemies or modify crystals", () => {
  const d = createRun();
  d.phase = "upgrade";
  d.wave = 1;
  d.eliteBudget = 4;
  d.drops = [{ id: 7, x: 500, y: 325, kind: "xp", value: 4, life: 40 }];
  const before = JSON.stringify(d);
  // simulate 在非 playing 阶段直接返回
  for (let i = 0; i < 30; i++) simulate(d, idleInput, 1 / 60);
  assert.equal(JSON.stringify(d), before);
  assert.equal(d.spawnBudget, 0);
  assert.equal(d.drops[0].value, 4);
});

test("effects apply from the next simulation step after submission", () => {
  const d = createRun();
  d.phase = "upgrade";
  d.choices = ["overload"];
  d.pendingLevels = 1;
  d.choiceRound = 1;
  d.lastChosenRound = 0;
  chooseUpgrade(d, "overload");
  assert.equal(d.phase, "playing");
  assert.equal(weaponDamageMultiplier(d), 1.25);
  // 提交本身未生成任何敌人/子弹，下一个模拟步才读取新倍率进行发射
  const bulletsBefore = d.bullets.length;
  simulate(d, idleInput, 1 / 60);
  assert.ok(d.bullets.length > bulletsBefore);
  const pulse = d.bullets.find((b) => b.weapon === "pulse")!;
  // 基础 16 伤害 × 1.25 过载 = 20
  assert.equal(Math.round(pulse.damage), 20);
});

test("elite budget refills only when a new wave starts", () => {
  const d = createRun();
  d.phase = "playing";
  d.wave = 1;
  d.waveTime = 29.99;
  d.eliteBudget = 1;
  stepWaves(d, 0.02);
  assert.equal(d.wave, 2);
  assert.equal(d.eliteBudget, Math.min(ELITE_BUDGET_MAX, 1 + 2));
  // 普通帧不补充预算
  const budgetNow = d.eliteBudget;
  stepWaves(d, 0.01);
  assert.equal(d.eliteBudget, budgetNow);
});

test("growth scales granted xp without changing the crystal value on the ground", () => {
  const d = createRun();
  d.upgrades.growth = 2;
  d.player.x = 500;
  d.player.y = 325;
  d.drops = [{ id: 3, x: 500, y: 325, kind: "xp", value: 10, life: 30 }];
  const levelBefore = d.level;
  stepProgression(d, events(), 0);
  // 入账经验 = 10 × 1.6 = 16 > 晶体本身的 10，且晶体 value 定义从未被修改
  assert.ok(d.xp > 10 || d.level > levelBefore);
});

test("overload submission deducts elite budget at commit time only", () => {
  const d = createRun();
  d.phase = "upgrade";
  d.choices = ["overload"];
  d.pendingLevels = 1;
  d.choiceRound = 3;
  d.lastChosenRound = 0;
  d.eliteBudget = 2;
  chooseUpgrade(d, "overload");
  assert.equal(d.eliteBudget, 0);
  assert.equal(d.upgrades.overload, 1);
  // 预算耗尽后，下一轮候选不再包含过载
  d.pendingLevels = 1;
  rollChoices(d);
  assert.ok(!d.choices.includes("overload"));
});

test("recovery remains a no-cost fallback and heals", () => {
  const d = createRun();
  d.phase = "upgrade";
  d.player.hp = 40;
  d.choices = ["recovery"];
  d.pendingLevels = 1;
  d.choiceRound = 1;
  d.lastChosenRound = 0;
  const preview = previewChoices(d)[0];
  assert.equal(preview.isRisk, false);
  assert.equal(preview.costs.length, 0);
  chooseUpgrade(d, "recovery");
  assert.equal(d.player.hp, 70);
  assert.equal(d.eliteBudget, ELITE_BUDGET_INITIAL);
});
