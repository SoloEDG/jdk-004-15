import { useState } from "react";
import { AlertTriangle, TrendingUp, TrendingDown, Lock } from "lucide-react";
import type { GameDoc } from "../../../shared/types";
import { previewChoices } from "../model/preview";
import type { PreviewStat } from "../model/preview";

function StatLine({ stat }: { stat: PreviewStat }) {
  const Icon =
    stat.direction === "up"
      ? TrendingUp
      : stat.direction === "down"
        ? TrendingDown
        : Lock;
  const tone =
    stat.direction === "up"
      ? "stat-up"
      : stat.direction === "down"
        ? "stat-down"
        : "stat-flat";
  return (
    <div className={`preview-stat ${tone}`}>
      <span className="preview-stat-label">
        <Icon size={11} />
        {stat.label}
      </span>
      <span className="preview-stat-value mono">
        {stat.before} <i>→</i> <b>{stat.after}</b>
      </span>
    </div>
  );
}

export function UpgradeDialog({
  doc,
  choose,
}: {
  doc: GameDoc;
  choose: (id: string) => void;
}) {
  const previews = previewChoices(doc);
  // 本地锁：同一轮候选点击后立即禁用全部按钮，配合引擎轮次令牌双保险
  const [locked, setLocked] = useState(false);
  const submit = (id: string) => {
    if (locked) return;
    setLocked(true);
    choose(id);
  };
  return (
    <div className="overlay">
      <div className="upgrade-dialog">
        <div className="eyebrow">EVOLUTION AVAILABLE</div>
        <h2>适应，然后生存。</h2>
        <p>
          等级 {doc.level} · 待处理升级 {doc.pendingLevels} 项 ·
          预览仅推演数值，提交后从下一模拟步生效
        </p>
        <div className="upgrade-options">
          {previews.map((p) => (
            <button
              key={p.id}
              className={p.isRisk ? "risk-card" : "safe-card"}
              disabled={locked}
              onClick={() => submit(p.id)}
            >
              <span className="upgrade-symbol">{p.isRisk ? "⚠" : "✧"}</span>
              <small>
                {p.category} · {p.levelLabel}
              </small>
              <h3>{p.name}</h3>
              <p>{p.description}</p>
              <div className="preview-block">
                {p.benefits.map((line, i) => (
                  <div className="preview-line benefit" key={`b${i}`}>
                    <TrendingUp size={11} />
                    <span>{line}</span>
                  </div>
                ))}
                {p.costs.map((line, i) => (
                  <div className="preview-line cost" key={`c${i}`}>
                    <AlertTriangle size={11} />
                    <span>{line}</span>
                  </div>
                ))}
              </div>
              <div className="preview-stats">
                {p.stats.map((stat, i) => (
                  <StatLine key={i} stat={stat} />
                ))}
              </div>
              <span className="choose-label">
                {p.costs.length ? "承担代价并强化 ↗" : "选择升级 ↗"}
              </span>
            </button>
          ))}
        </div>
        <small className="muted">
          普通升级无代价，风险强化的收益与代价都会同步到火力、敌潮、物资与面板 ·
          同一候选快速双击只会提交一次
        </small>
      </div>
    </div>
  );
}
