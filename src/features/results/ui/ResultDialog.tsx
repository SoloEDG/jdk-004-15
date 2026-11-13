import type { GameDoc } from "../../../shared/types";
import { formatTime } from "../../../shared/math";
import {
  damageReduction,
  eliteSpawnRate,
  eliteWaveThreshold,
  riskRank,
  weaponDamageMultiplier,
  xpMultiplier,
} from "../../progression/model/risk";
const pct = (v: number) => `${Math.round(v * 100)}%`;
export function ResultDialog({
  doc,
  restart,
}: {
  doc: GameDoc;
  restart: () => void;
}) {
  const overload = riskRank(doc, "overload");
  const growth = riskRank(doc, "growth");
  return (
    <div className="overlay">
      <div className="result-dialog">
        <div className="eyebrow">
          MISSION {doc.victory ? "COMPLETE" : "ENDED"}
        </div>
        <h2>{doc.victory ? "信号已送达。" : "信号暂时中断。"}</h2>
        <p>每一次坠落，都是下一次进化的起点。</p>
        <div className="result-grid">
          <div>
            <strong>{formatTime(doc.time)}</strong>
            <small>生存时间</small>
          </div>
          <div>
            <strong>{doc.stats.kills}</strong>
            <small>击败敌人</small>
          </div>
          <div>
            <strong>{doc.level}</strong>
            <small>最终等级</small>
          </div>
        </div>
        <div className="damage-breakdown">
          {Object.entries(doc.stats.byWeapon).map(([key, value]) => (
            <div key={key}>
              <span>{key.toUpperCase()}</span>
              <span>{Math.round(value)} DMG</span>
            </div>
          ))}
        </div>
        {overload + growth > 0 && (
          <div className="risk-summary">
            <div className="eyebrow">RISK BUILD · 风险构筑结算</div>
            {overload > 0 && (
              <div className="risk-summary-row">
                <span>
                  过载强化 ×{overload} · 火力 {pct(weaponDamageMultiplier(doc))}
                </span>
                <span className="cost-text">
                  精英第 {eliteWaveThreshold(doc)} 波起 · 出现率{" "}
                  {pct(eliteSpawnRate(doc))}
                </span>
              </div>
            )}
            {growth > 0 && (
              <div className="risk-summary-row">
                <span>
                  加速成长 ×{growth} · 经验 {pct(xpMultiplier(doc))}
                </span>
                <span className="cost-text">
                  减伤降至 {pct(damageReduction(doc))}
                </span>
              </div>
            )}
          </div>
        )}
        <button className="primary" onClick={restart}>
          重新接入 ↗
        </button>
        <p className="tiny">本地已记录 {doc.records.length} 次行动</p>
      </div>
    </div>
  );
}
