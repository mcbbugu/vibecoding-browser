import { useState } from 'react';
import './AnalyticsConsentModal.css';

/**
 * 隐私同意弹窗
 * 首次启动时询问用户是否同意匿名数据收集
 */
export default function AnalyticsConsentModal({ onConsent }) {
  const [show, setShow] = useState(true);

  const handleAccept = () => {
    setShow(false);
    onConsent(true);
  };

  const handleDecline = () => {
    setShow(false);
    onConsent(false);
  };

  if (!show) return null;

  return (
    <div className="analytics-consent-overlay">
      <div className="analytics-consent-modal">
        <div className="consent-header">
          <h2>帮助改进 VibeCoding Browser</h2>
        </div>

        <div className="consent-body">
          <p className="consent-description">
            我们想收集匿名使用数据来改进产品，你的隐私很重要。
          </p>

          <div className="consent-details">
            <div className="consent-section">
              <h3>✅ 会收集：</h3>
              <ul>
                <li>功能使用情况</li>
                <li>崩溃和错误信息</li>
                <li>匿名设备 ID</li>
                <li>系统版本</li>
              </ul>
            </div>

            <div className="consent-section">
              <h3>❌ 不会收集：</h3>
              <ul>
                <li>个人信息</li>
                <li>浏览记录或网址</li>
                <li>项目内容或代码</li>
                <li>任何可识别身份的数据</li>
              </ul>
            </div>
          </div>

          <p className="consent-note">
            💡 可随时在设置中修改
          </p>
        </div>

        <div className="consent-actions">
          <button 
            className="btn-decline" 
            onClick={handleDecline}
          >
            拒绝
          </button>
          <button 
            className="btn-accept" 
            onClick={handleAccept}
          >
            同意
          </button>
        </div>
      </div>
    </div>
  );
}

