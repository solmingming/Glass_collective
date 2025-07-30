import React, { useState } from "react";
import "./../styles/DaoNewProposalForm.css";

interface NewProposalFormProps {
  onBack: () => void;
}

const NewProposalForm: React.FC<NewProposalFormProps> = ({ onBack }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");

  const handlePublish = () => {
    // TODO: 여기에 제안을 저장/발행하는 로직 추가
    console.log('Publishing proposal:', { title, desc });
    
    // 발행 후 다시 DaoProposal로 이동
    onBack();
  };

  return (
    <div className="new-proposal-container">
      <div className="new-proposal-main">
        <div className="new-proposal-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>New Proposals</h2>
          <button className="publish-btn" onClick={handlePublish}>Publish ➤</button>
        </div>
        <div className="new-proposal-form">
          <input
            className="proposal-title-input"
            type="text"
            placeholder="Title *"
            maxLength={256}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />
          <div className="input-count">{title.length}/256</div>
          <textarea
            className="proposal-desc-input"
            placeholder="Propose something...*"
            maxLength={4000}
            value={desc}
            onChange={e => setDesc(e.target.value)}
          />
          <div className="input-count">{desc.length}/4000</div>
        </div>
      </div>
      <div className="proposal-side-info">
        <div className="choices">
          <div>Choices</div>
          <div className="choice for">✔️ For</div>
          <div className="choice against">❌ Against</div>
          <div className="choice abstain">➖ Abstain</div>
        </div>
        <div className="timeline">
          <div>Time line</div>
          <div className="proposal-timeline-item created">
            <span className="dot" /> created <span className="date">2023.07.17</span>
          </div>
          <div className="proposal-timeline-item start">
            <span className="dot" /> start <span className="date">2023.07.17/00:00</span>
          </div>
          <div className="proposal-timeline-item end">
            <span className="dot" /> end <span className="date">2023.08.01/00:00</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewProposalForm;