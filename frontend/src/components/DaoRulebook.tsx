import React from "react";
import "./../styles/DaoRulebook.css";

const ruleSnapshot = [
  { icon: "🗳️", text: "Proposal Passes with ≥ 60% Yes" },
  { icon: "👤", text: "1 Wallet = 1 Vote" },
  { icon: "💸", text: "Fund Usage Requires Voting Approval" },
  { icon: "📅", text: "Rules Change via Proposal + 3d Vote" },
  { icon: "🌟", text: "All Members Can Submit Proposals" },
];

const ruleBookList = [
  "1. Voting Rules",
  "2. Proposal Guidelines",
  "3. Treasury Management",
  "4. Roles & Responsibilities",
  "5. Rule Amendments",
  "6. Integrity Principles",
  "7. Emergency Protocols",
  "8. Founding Values",
];

const DaoRulebook: React.FC = () => {
  return (
    <div className="dao-rulebook-container">
      <section className="rule-snapshot">
        <h2>Rule Snapshot</h2>
        <ul>
          {ruleSnapshot.map((item, idx) => (
            <li key={idx}>
              <span className="icon">{item.icon}</span> {item.text}
            </li>
          ))}
        </ul>
      </section>
      <section className="rule-book">
        <h2>Rule Book</h2>
        <ul>
          {ruleBookList.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
        <div className="smartcontracts-link">
          &gt; <span>smartcontracts</span>
        </div>
      </section>
    </div>
  );
};

export default DaoRulebook;