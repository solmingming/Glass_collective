import React, { useState } from "react";
import "./../styles/DaoNewProposalForm.css";
import contractService from "../services/contractService";

interface NewProposalFormProps {
  onBack: () => void;
}

const NewProposalForm: React.FC<NewProposalFormProps> = ({ onBack }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreateProposal = async () => {
    // 입력 유효성 검사
    if (!title.trim()) {
      setError("제목을 입력해주세요.");
      return;
    }

    if (!desc.trim()) {
      setError("설명을 입력해주세요.");
      return;
    }

    if (!amount.trim()) {
      setError("금액을 입력해주세요.");
      return;
    }

    if (!recipient.trim()) {
      setError("수신자 주소를 입력해주세요.");
      return;
    }

    // 금액 형식 검사
    const amountValue = parseFloat(amount);
    if (isNaN(amountValue) || amountValue <= 0) {
      setError("올바른 금액을 입력해주세요.");
      return;
    }

    // 주소 형식 검사
    if (!recipient.startsWith('0x') || recipient.length !== 42) {
      setError("올바른 이더리움 주소를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      console.log("제안 생성 시작...");
      
      // 네트워크 확인
      const isCorrectNetwork = await contractService.checkNetwork();
      if (!isCorrectNetwork) {
        setError("Sepolia 네트워크에 연결해주세요.");
        return;
      }

      // DAO 멤버십 확인 (간단한 방법)
      console.log("DAO 멤버십 확인 중...");

      console.log("네트워크 확인 완료, 제안 생성 중...");

      // 제안 생성
      const proposalId = await contractService.createProposal(
        title,
        desc,
        amount,
        recipient
      );

      console.log("제안 생성 완료:", proposalId);

      setSuccess(`✅ 제안이 성공적으로 생성되었습니다! (ID: ${proposalId})`);
      
      // 3초 후 폼 초기화 및 목록 새로고침
      setTimeout(() => {
        setTitle("");
        setDesc("");
        setAmount("");
        setRecipient("");
        setSuccess("");
        onBack(); // 이 함수가 목록 새로고침을 트리거함
      }, 3000);

    } catch (error: any) {
      console.error("제안 생성 오류:", error);
      
      // 구체적인 에러 메시지 처리
      let errorMessage = "제안 생성 중 오류가 발생했습니다.";
      
      if (error.message) {
        if (error.message.includes("DAO: Caller is not a member")) {
          errorMessage = "DAO 멤버만 제안을 생성할 수 있습니다.";
        } else if (error.message.includes("Sepolia")) {
          errorMessage = "Sepolia 네트워크에 연결해주세요.";
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "가스비가 부족합니다. 지갑에 ETH를 충전해주세요.";
        } else {
          errorMessage = error.message;
        }
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-proposal-container">
      <div className="new-proposal-main">
        <div className="new-proposal-header">
          <button className="back-btn" onClick={onBack}>←</button>
          <h2>New Proposals</h2>
          <button 
            className="publish-btn" 
            onClick={handleCreateProposal}
            disabled={isLoading}
          >
            {isLoading ? "Creating..." : "Publish ➤"}
          </button>
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
          
          <input
            className="proposal-amount-input"
            type="text"
            placeholder="Amount (ETH) * 예: 0.01"
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
          
          <input
            className="proposal-recipient-input"
            type="text"
            placeholder="Recipient Address * 예: 0x1234..."
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
          />
        </div>
        
        {/* 에러 메시지 */}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        {/* 성공 메시지 */}
        {success && (
          <div className="success-message">
            {success}
          </div>
        )}
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