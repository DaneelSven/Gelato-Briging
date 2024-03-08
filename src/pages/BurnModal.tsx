import React, { useState } from 'react';
import styles from "@/styles/Home.module.css";

interface InputModalProps {
    isOpen: boolean;
    onClose: () => void;
    onTrade: (tokenId: string) => void;
  }

const BurnModal: React.FC<InputModalProps> = ({ isOpen, onClose, onTrade }) => {
    const [tokenId, setTokenId] = useState('');
    const [isTokenIdValid, setIsTokenIdValid] = useState(false);

    const handleTokenIdChange = (e: { target: { value: string; }; }) => {
        const value = e.target.value;
        // This regular expression matches only positive numbers
        const isValid = /^[1-9]\d*$/.test(value);
        setTokenId(value);
        setIsTokenIdValid(isValid);
    };  

    const handleSubmit = () => {
        if (isTokenIdValid) {
            onTrade(tokenId);
            onClose();
        }
    };
    if (!isOpen) return null;

    return (
        <div className={styles.modalOverlay}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>×</button>
                <h2 className={styles.modalTitle}>Burn Tokens</h2>

                <div className={styles.errorText}>
                    Please enter a valid positve amount (0, 1, or 2).
                </div>
                <input
                    className={styles.input}
                    type="text"
                    placeholder="Token ID (1,2 or more)"
                    value={tokenId}
                    onChange={handleTokenIdChange}
                />
                <div className={styles.buttonContainer}>
                    <button className={styles.submitButton} onClick={handleSubmit} disabled={!isTokenIdValid}>Burn</button>

                </div>
            </div>
        </div>
    );
};

export default BurnModal;
