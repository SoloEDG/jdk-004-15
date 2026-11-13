import type { GameDoc } from "../../../shared/types";
import {
  damageReduction,
  effectiveArmor,
  riskRank,
} from "../../progression/model/risk";
export function Vitals({ doc }: { doc: GameDoc }) {
  const armor = effectiveArmor(doc);
  const reduction = damageReduction(doc);
  const growth = riskRank(doc, "growth");
  return (
    <div className="vitals">
      <div className="section-caption">
        <span>机体完整度</span>
        <span className="mono">
          {Math.ceil(doc.player.hp)} <small>/ {doc.player.maxHp}</small>
        </span>
      </div>
      <div className="bar health">
        <i style={{ width: `${(doc.player.hp / doc.player.maxHp) * 100}%` }} />
      </div>
      <div className="armor-row">
        <span className={growth > 0 ? "armor-penalty" : ""}>
          装甲 {armor} 级 · 减伤 {Math.round(reduction * 100)}%
        </span>
        {growth > 0 && <small className="cost-tag">加速成长 −{growth} 级</small>}
      </div>
      <div className="vitals-foot">
        <span className="status-dot" />{" "}
        {doc.player.hp > 30 ? "生命信号稳定" : "警告 · 装甲受损"}
        <span>MK.01</span>
      </div>
    </div>
  );
}
