/**
 * Analytics 匿名统计工具
 * 使用 PostHog 追踪用户行为（匿名）
 */

import { v4 as uuidv4 } from 'uuid';

// PostHog 配置
const POSTHOG_API_KEY = 'phc_6Dl1uE3H779LLRA38G6I9M3w8OZDNHHv16xCdYPdSHx';
const POSTHOG_HOST = 'https://app.posthog.com';

class Analytics {
  constructor() {
    this.enabled = false;
    this.deviceId = null;
    this.posthog = null;
  }

  /**
   * 初始化 Analytics
   * @param {boolean} userConsent - 用户是否同意数据收集
   */
  async init(userConsent = null) {
    // 检查用户是否已经做出选择
    if (userConsent === null) {
      const stored = localStorage.getItem('analytics_consent');
      if (stored !== null) {
        userConsent = stored === 'true';
      } else {
        // 首次启动，默认禁用，等待用户选择
        return;
      }
    }

    this.enabled = userConsent;
    localStorage.setItem('analytics_consent', String(userConsent));

    if (!this.enabled) {
      console.log('[Analytics] 用户拒绝数据收集');
      return;
    }

    // 获取或生成设备 ID
    this.deviceId = localStorage.getItem('device_id');
    if (!this.deviceId) {
      this.deviceId = `device_${uuidv4()}`;
      localStorage.setItem('device_id', this.deviceId);
    }

    // 初始化 PostHog（渲染进程）
    if (typeof window !== 'undefined') {
      try {
        const posthog = await import('posthog-js');
        this.posthog = posthog.default;
        this.posthog.init(POSTHOG_API_KEY, {
          api_host: POSTHOG_HOST,
          autocapture: false,
          capture_pageview: false,
          capture_pageleave: false,
          disable_session_recording: true,
          enable_heatmaps: false,
          persistence: 'localStorage'
        });
        this.posthog.identify(this.deviceId);
        console.log('[Analytics] 初始化成功, deviceId:', this.deviceId);
      } catch (error) {
        console.error('[Analytics] 初始化失败:', error);
      }
    }
  }

  /**
   * 追踪事件（失败不影响主程序）
   * @param {string} event - 事件名称
   * @param {object} properties - 事件属性
   */
  track(event, properties = {}) {
    if (!this.enabled || !this.posthog) {
      return;
    }

    // 异步执行，不阻塞主程序
    setTimeout(() => {
      try {
        this.posthog.capture(event, {
          ...properties,
          device_id: this.deviceId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        // 静默失败，不影响用户
      }
    }, 0);
  }

  /**
   * 设置用户同意状态
   * @param {boolean} consent - 是否同意
   */
  setConsent(consent) {
    this.init(consent);
  }

  /**
   * 检查是否已获得用户同意
   */
  hasConsent() {
    return localStorage.getItem('analytics_consent') !== null;
  }

  /**
   * 获取设备 ID
   */
  getDeviceId() {
    return this.deviceId || localStorage.getItem('device_id');
  }
}

// 导出单例
const analytics = new Analytics();

// 常用事件追踪方法
export const trackAppLaunched = (version) => {
  analytics.track('app_launched', {
    version,
    platform: navigator.platform,
    user_agent: navigator.userAgent
  });
};

export const trackDailyActive = () => {
  const today = new Date().toDateString();
  const lastActive = localStorage.getItem('last_active_date');
  
  if (lastActive !== today) {
    analytics.track('daily_active', {
      date: today
    });
    localStorage.setItem('last_active_date', today);
  }
};

export const trackTrialStarted = (trialDays) => {
  analytics.track('trial_started', {
    trial_days: trialDays
  });
};

export const trackTrialEnded = (converted) => {
  analytics.track('trial_ended', {
    converted
  });
};

export const trackLicenseActivated = (licenseKey) => {
  analytics.track('license_activated', {
    // 只记录前缀，不记录完整 key
    license_prefix: licenseKey.substring(0, 4)
  });
};

export const trackFeatureUsed = (feature, metadata = {}) => {
  analytics.track('feature_used', {
    feature,
    ...metadata
  });
};

export const trackProjectOpened = (projectType) => {
  analytics.track('project_opened', {
    project_type: projectType
  });
};

export const trackError = (error, context = {}) => {
  analytics.track('error_occurred', {
    error_message: error.message,
    error_stack: error.stack?.substring(0, 500), // 限制长度
    ...context
  });
};

export default analytics;

