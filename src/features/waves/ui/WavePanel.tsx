import type { GameDoc } from "../../../shared/types";
import {
  ELITE_BUDGET_MAX,
  eliteSpawnRate,
  eliteWaveThreshold,
  getEliteBudget,
  riskRank,
} from "../../progression/model/risk";
export function WavePanel({ doc }: { doc: GameDoc }) {
  const eliteBudget = getEliteBudget(doc);
  const overload = riskRank(doc, "overload");
  return (
    <section className="panel">
      <div className="section-caption">
        <span>波次进程</span>
        <span className="badge">8 WAVES</span>
      </div>
      <div className="wave-num mono">
        {Math.max(1, doc.wave).toString().padStart(2, "0")}
        <span>/ 08</span>
      </div>
      <div className="wave-steps">
        {Array.from({ length: 8 }, (_, i) => (
          <i key={i} className={i < Math.max(1, doc.wave) ? "active" : ""} />
        ))}
      </div>
      <div className="section-caption muted">
        <span>
          {doc.wave < 3
            ? "外围侦察群"
            : doc.wave < 6
              ? "重装突击群"
              : "深空精英群"}
        </span>
        <span className="mono">
          {Math.max(0, 30 - doc.waveTime).toFixed(0)}s
        </span>
      </div>
      <div className="bar">
        <i style={{ width: `${(doc.waveTime / 30) * 100}%` }} />
      </div>
      <div className={`elite-budget ${eliteBudget < 2 ? "depleted" : ""}`}>
        <div className="section-caption">
          <span>精英预算</span>
          <span className="mono">
            {eliteBudget} / {ELITE_BUDGET_MAX}
          </span>
        </div>
        <div className="elite-pips">
          {Array.from({ length: ELITE_BUDGET_MAX }, (_, i) => (
            <i key={i} className={i < eliteBudget ? "active" : ""} />
          ))}
        </div>
        <p className="tiny">
          精英自第 {eliteWaveThreshold(doc)} 波出现，出现率{" "}
          {Math.round(eliteSpawnRate(doc) * 100)}%
          {overload > 0
            ? ` · 过载 ×${overload} 已让精英提前来袭`
            : " · 过载强化会在此预算中扣除并提早精英波次"}
        </p>
      </div>
      <p className="tiny">每 30 秒进入新波次。撑过第八波，完成撤离。</p>
    </section>
  );
}
