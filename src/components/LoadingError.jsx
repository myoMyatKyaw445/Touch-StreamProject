import React, { useState, useEffect } from 'react';
import './LoadingError.css';

const LoadingError = ({ onRetry }) => {
  const [retryCount, setRetryCount] = useState(0);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    if (onRetry) onRetry();
  };

  return (
    <div className="error-container">
      <div className="error-content">
        <div className="error-icon">🌐</div>
        <h2 className="error-title">အင်တာနက် ချိတ်ဆက်မှု မရှိပါ</h2>
        <p className="error-message">
          ကျေးဇူးပြု၍ VPN အသုံးပြုပါ<br />
          သို့မဟုတ် အင်တာနက် ချိတ်ဆက်မှုကို စစ်ဆေးပါ
        </p>
        <button className="retry-button" onClick={handleRetry}>
          🔄 ပြန်စမ်းကြည့်မည်
        </button>
      </div>
    </div>
  );
};

export default LoadingError;