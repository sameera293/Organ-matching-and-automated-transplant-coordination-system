import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export default function SafetyBanner() {
  return (
    <div className="safety-banner">
      <span className="safety-badge">Academic Prototype</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <AlertTriangle size={16} color="#e11d48" />
        <span>
          <strong>DECISION-SUPPORT NOTICE:</strong> AI-generated results are for research and decision-support purposes only. 
          Final medical and allocation decisions remain with authorized healthcare professionals and applicable policies.
        </span>
      </div>
    </div>
  );
}
