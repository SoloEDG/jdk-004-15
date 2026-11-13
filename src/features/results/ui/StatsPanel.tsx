import type { GameDoc } from "../../../shared/types";
import {
  damageReduction,
  effectiveArmor,
  getEliteBudget,
  riskRank,
  weaponDamageMultiplier,
  xpMultiplier,
} from "../../progression/model/risk";
const pct = (v: number) => `${Math.round(v * 100)}%`;
export function StatsPanel({ doc }: { doc: GameDoc }) {
  const overload = riskRank(doc, "overload");
  const growth = riskRank(doc, "growth");
  return (
    <section className="panel stats">
      <div className="section-caption">
        <span>本局遥测</span>
        <span className="status-dot" />
      </div>
      <div className="stat-row">
        <span>击败敌人</span>
        <strong className="mono">
          {doc.stats.kills.toString().padStart(3, "0")}
        </strong>
      </div>
      <div className="stat-row">
        <span>累计伤害</span>
        <strong className="mono">
          {Math.round(doc.stats.damage).toLocaleString()}
        </strong>
      </div>
      <div className="stat-row">
        <span>拾取能量</span>
        <strong className="mono">{doc.stats.collected}</strong>
      </div>
      <div className="stat-row">
        <span>已受伤害</span>
        <strong className="mono">{Math.round(doc.stats.taken)}</strong>
      </div>
      <div className="build-mods">
        <div className="section-caption">
          <span>风险构筑</span>
          <span className="mono muted">
            {overload + growth > 0 ? `${overload + growth} 项生效` : "无"}
          </span>
        </div>
        <div className="stat-row">
          <span>火力输出倍率</span>
          <strong className={`mono ${overload ? "mod-benefit" : ""}`}>
            {pct(weaponDamageMultiplier(doc))}
          </strong>
        </div>
        <div className="stat-row">
          <span>经验获取倍率</span>
          <strong className={`mono ${growth ? "mod-benefit" : ""}`}>
            {pct(xpMultiplier(doc))}
          </strong>
        </div>
        <div className="stat-row">
          <span>有效装甲 / 减伤</span>
          <strong className={`mono ${growth ? "mod-cost" : ""}`}>
            {effectiveArmor(doc)} 级 · {pct(damageReduction(doc))}
          </strong>
        </div>
        <div className="stat-row">
          <span>精英预算余量</span>
          <strong
            className={`mono ${getEliteBudget(doc) < 2 ? "mod-cost" : ""}`}
          >
            {getEliteBudget(doc)}
          </strong>
        </div>
      </div>
    </section>
  );
}
