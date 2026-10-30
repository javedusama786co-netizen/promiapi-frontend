// components/SubscriptionGuard.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';

const PLAN_LIMITS = {
  price_free: { canUseShopify: false, canUseAi: false, flowBuildersLimit: 0 },
  price_standard: { canUseShopify: true, canUseAi: false, flowBuildersLimit: 5 },
  price_premium: { canUseShopify: true, canUseAi: true, flowBuildersLimit: 999 },
  price_ultimate: { canUseShopify: true, canUseAi: true, flowBuildersLimit: 999 },
};

export default function SubscriptionGuard({ children, featureKey, userSubscription }) {
  const navigate = useNavigate();

  const isSubscribed = userSubscription?.subscribed;
  const currentPlan = userSubscription?.planId || "price_free";
  const userLimits = PLAN_LIMITS[currentPlan] || PLAN_LIMITS.price_free;

  const hasAccess = isSubscribed && userLimits[featureKey];

  if (!hasAccess) {
    return (
      <div style={{ position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
        {/* Blur view of disabled content */}
        <div style={{ filter: 'blur(5px)', opacity: 0.35, pointerEvents: 'none' }}>
          {children}
        </div>

        {/* Lock Overlay */}
        <div style={styles.lockOverlay}>
          <span style={{ fontSize: '36px' }}>🔒</span>
          <h3 style={{ margin: '8px 0 4px 0', color: '#0f172a', fontWeight: '800' }}>Feature Locked</h3>
          <p style={{ color: '#64748b', fontSize: '13.5px', margin: '0 0 16px 0', maxWidth: '300px' }}>
            Is feature ko access karne ke liye apna subscription plan active ya upgrade karein.
          </p>
          <button 
            onClick={() => navigate('/dashboard/subscription')} 
            style={styles.upgradeBtn}
          >
            Upgrade Plan →
          </button>
        </div>
      </div>
    );
  }

  return children;
}

const styles = {
  lockOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(255, 255, 255, 0.88)',
    backdropFilter: 'blur(3px)',
    padding: '24px',
    textAlign: 'center'
  },
  upgradeBtn: {
    background: '#2563eb',
    color: '#ffffff',
    border: 'none',
    padding: '10px 22px',
    borderRadius: '10px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '14px',
    boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)'
  }
};