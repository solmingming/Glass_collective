import React, { useState } from "react";
import { useParams } from "react-router-dom";
import "./../styles/DaoNewProposalForm.css";
import { contractService, type ProposalCreationData, type ProposalType } from "../services/contractService";
import { ethers } from "ethers";

interface NewProposalFormProps {
  onProposalCreated: () => void;
  onBack: () => void;
}

const NewProposalForm: React.FC<NewProposalFormProps> = ({ onProposalCreated, onBack }) => {
  const { id: daoAddress } = useParams<{ id: string }>();

  // --- *** 1. MODIFIED: 상태 변수 수정 *** ---
  const [proposalType, setProposalType] = useState<ProposalType | null>(null); // 초기값 null
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [recipient, setRecipient] = useState("");
  const [ruleToChange, setRuleToChange] = useState("passCriteria");
  const [newValue, setNewValue] = useState("");

  // --- *** NEW: 규칙별 입력 범위 설정 함수 *** ---
  const getRuleInputConfig = (rule: string) => {
    switch (rule) {
      case 'passCriteria':
        return {
          min: 1,
          max: 100,
          step: 1,
          placeholder: "Enter percentage (1-100%)"
        };
      case 'votingDuration':
        return {
          min: 1,
          max: 365,
          step: 1,
          placeholder: "Enter days (1-365)"
        };
      case 'entryFee':
        return {
          min: 0,
          max: 100,
          step: 0.01,
          placeholder: "Enter ETH amount (0-100)"
        };
      case 'absentPenalty':
        return {
          min: 0,
          max: 100,
          step: 0.01,
          placeholder: "Enter ETH amount (0-100)"
        };
      case 'countToExpel':
        return {
          min: 1,
          max: 50,
          step: 1,
          placeholder: "Enter count (1-50)"
        };
      case 'scoreToExpel':
        return {
          min: 0,
          max: 1000,
          step: 1,
          placeholder: "Enter score (0-1000)"
        };
      default:
        return {
          min: 0,
          max: 999999,
          step: 1,
          placeholder: "Enter new value"
        };
    }
  };

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleCreateProposal = async () => {
    if (!daoAddress) { setError("DAO address not found."); return; }
    
    // --- *** 2. MODIFIED: 라디오 버튼 선택 여부 및 종류별 유효성 검사 강화 *** ---
    if (!proposalType) {
      setError("Please select a proposal type."); return;
    }
    setError("");

    let validationError = "";
    switch (proposalType) {
      case 'treasury-in':
        if (!title.trim() || !description.trim() || !amount.trim()) 
          validationError = "Please fill in title, description, and amount.";
        break;
      case 'treasury-out':
        if (!title.trim() || !description.trim() || !amount.trim() || !recipient.trim()) 
          validationError = "Please fill in all fields for the payout.";
        if (!ethers.isAddress(recipient)) 
          validationError = "Invalid recipient address.";
        break;
      case 'rule-change':
        if (!description.trim() || !newValue.trim()) 
          validationError = "Please provide a description and a new value.";
        else {
          // 범위 검증 로직 추가
          const config = getRuleInputConfig(ruleToChange);
          const numValue = Number(newValue);
          if (isNaN(numValue)) {
            validationError = "Please enter a valid number.";
          } else if (numValue < config.min || numValue > config.max) {
            validationError = `Please enter a value between ${config.min} and ${config.max} for ${ruleToChange}.`;
          }
        }
        break;
    }

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setSuccess("");
    
    const proposalData: ProposalCreationData = {
      daoAddress, title, description, proposalType,
      amount: (proposalType === 'treasury-in' || proposalType === 'treasury-out') ? amount : undefined,
      recipient: proposalType === 'treasury-out' ? recipient : undefined,
      ruleToChange: proposalType === 'rule-change' ? ruleToChange : undefined,
      newValue: proposalType === 'rule-change' ? Number(newValue) : undefined,
    };

    try {
      await contractService.createProposal(proposalData);
      setSuccess("✅ Proposal created successfully!");
      setTimeout(() => onProposalCreated(), 2000);
    } catch (err: any) {
      setError(err.message || "An error occurred while creating proposal.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="new-proposal-container">
      <div className="new-proposal-header">
        <button className="back-btn" onClick={onBack}>← Back</button>
        <h2>Create New Proposal</h2>
        <button className="publish-btn" onClick={handleCreateProposal} disabled={isLoading || !proposalType}>
          {isLoading ? "Publishing..." : "Publish ➤"}
        </button>
      </div>
      
      {/* --- *** 3. NEW: 드롭다운을 라디오 버튼으로 교체 *** --- */}
      <div className="proposal-type-radio">
        <h4>Select Proposal Type</h4>
        <div className="radio-group">
          <label className={proposalType === 'treasury-in' ? 'active' : ''}>
            <input type="radio" value="treasury-in" name="proposalType" checked={proposalType === 'treasury-in'} onChange={e => setProposalType(e.target.value as ProposalType)} />
            💰 Treasury Deposit
          </label>
          <label className={proposalType === 'treasury-out' ? 'active' : ''}>
            <input type="radio" value="treasury-out" name="proposalType" checked={proposalType === 'treasury-out'} onChange={e => setProposalType(e.target.value as ProposalType)} />
            💸 Treasury Payout
          </label>
          <label className={proposalType === 'rule-change' ? 'active' : ''}>
            <input type="radio" value="rule-change" name="proposalType" checked={proposalType === 'rule-change'} onChange={e => setProposalType(e.target.value as ProposalType)} />
            📜 Rule Change
          </label>
        </div>
      </div>

      <div className="new-proposal-form">
        {/* --- *** 4. MODIFIED: 선택된 라디오 버튼에 따라 다른 입력 필드 렌더링 *** --- */}
        
        {/* 공통 입력 필드: 설명 */}
        <textarea
          className="proposal-desc-input"
          placeholder="Describe the purpose of your proposal in detail..."
          value={description}
          onChange={e => setDescription(e.target.value)}
        />

        {/* 입금(treasury-in) 선택 시 */}
        {proposalType === 'treasury-in' && (
          <>
            <input className="proposal-title-input" type="text" placeholder="Title (e.g., Q3 Operational Fund Deposit)" value={title} onChange={e => setTitle(e.target.value)} />
            <input type="text" placeholder="Amount (ETH) to be deposited" value={amount} onChange={e => setAmount(e.target.value)} />
          </>
        )}

        {/* 출금(treasury-out) 선택 시 */}
        {proposalType === 'treasury-out' && (
          <>
            <input className="proposal-title-input" type="text" placeholder="Title (e.g., Marketing Campaign Payout)" value={title} onChange={e => setTitle(e.target.value)} />
            <input type="text" placeholder="Amount (ETH) to pay out" value={amount} onChange={e => setAmount(e.target.value)} />
            <input type="text" placeholder="Recipient Address (0x...)" value={recipient} onChange={e => setRecipient(e.target.value)} />
          </>
        )}

        {/* 규칙 변경(rule-change) 선택 시 */}
        {proposalType === 'rule-change' && (
          <div className="rule-change-inputs">
            <div>
              <label>Rule to Change:</label>
              <select value={ruleToChange} onChange={e => setRuleToChange(e.target.value)}>
                  <option value="passCriteria">Pass Threshold (%)</option>
                  <option value="votingDuration">Voting Duration (days)</option>
                  <option value="entryFee">Entry Fee (ETH)</option>
                  <option value="absentPenalty">Penalty Fee (ETH)</option>
                  <option value="countToExpel">Expel Count</option>
                  <option value="scoreToExpel">Score to Expel</option>
              </select>
            </div>
            <div>
              <label>New Value:</label>
              {(() => {
                const config = getRuleInputConfig(ruleToChange);
                return (
                  <input 
                    type="number" 
                    min={config.min}
                    max={config.max}
                    step={config.step}
                    placeholder={config.placeholder}
                    value={newValue} 
                    onChange={e => setNewValue(e.target.value)} 
                  />
                );
              })()}
            </div>
          </div>
        )}
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
    </div>
  );
};

export default NewProposalForm;