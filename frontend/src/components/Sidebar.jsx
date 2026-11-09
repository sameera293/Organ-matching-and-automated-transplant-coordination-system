
import React from "react";
import {
  LayoutDashboard,
  Users,
  HeartHandshake,
  UserCheck,
  Cpu,
  Brain,
  Navigation,
  Network,
  SlidersHorizontal,
  BarChart3,
  Scale,
  Bell,
  CheckCircle2,
  Activity
} from 'lucide-react';

export default function Sidebar({
  activePage,
  setActivePage,
  unreadCount = 0,
}) {
  const navItems = [
    { category: "Overview" },
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },

    { category: "Entities" },
    { id: "donors", label: "Donors", icon: Users },
    { id: "organs", label: "Organs", icon: HeartHandshake },
    { id: "recipients", label: "Recipients", icon: UserCheck },

    { category: "AI & Optimization" },
    { id: "matching", label: "Matching Engine", icon: Cpu },
    { id: "explainability", label: "Explainability", icon: Brain },
    { id: "logistics", label: "Logistics & Routes", icon: Navigation },
    {
      id: "optimization",
      label: "Multi-Organ Hungarian",
      icon: Network,
    },
    {
      id: "scenarios",
      label: "What-If Scenarios",
      icon: SlidersHorizontal,
    },

    { category: "Governance & Audit" },
    {
      id: "review",
      label: "Professional Review",
      icon: CheckCircle2,
    },
    {
      id: "model_eval",
      label: "Model Evaluation",
      icon: BarChart3,
    },
    {
      id: "fairness",
      label: "Fairness Assessment",
      icon: Scale,
    },
    {
      id: "notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadCount > 0 ? unreadCount : null,
    },
  ];

  return (
    <aside className="sidebar">
      <div
        style={{
          padding: "20px 20px 16px",
          borderBottom: "1px solid #1e293b",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #0284c7, #0ea5e9)",
              padding: "8px",
              borderRadius: "8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Activity size={22} color="#ffffff" />
          </div>

          <div>
            <div
              style={{
                fontWeight: "700",
                fontSize: "0.95rem",
                letterSpacing: "-0.2px",
              }}
            >
              OrganMatch AI
            </div>
            <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
              Decision-Support Framework
            </div>
          </div>
        </div>
      </div>

      <nav style={{ padding: "12px 0 24px", flex: 1 }}>
        {navItems.map((item, idx) => {
          if (item.category) {
            return (
              <div key={`cat-${idx}`} className="nav-category">
                {item.category}
              </div>
            );
          }

          const IconComponent = item.icon;
          const isActive = activePage === item.id;

          return (
            <div
              key={item.id}
              className={`nav-item ${isActive ? "active" : ""}`}
              onClick={() => setActivePage(item.id)}
              aria-current={isActive ? "page" : undefined}
              style={{
                width: "100%",
                textAlign: "left",
                font: "inherit",
                cursor: "pointer",
              }}
            >
              <IconComponent size={18} />

              <span style={{ flex: 1 }}>{item.label}</span>

              {item.badge != null && (
                <span
                  style={{
                    backgroundColor: "#ef4444",
                    color: "white",
                    borderRadius: "10px",
                    padding: "1px 6px",
                    fontSize: "0.7rem",
                    fontWeight: "700",
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
          );
        })}
      </nav>

      <div
        style={{
          padding: "16px 20px",
          borderTop: "1px solid #1e293b",
          fontSize: "0.72rem",
          color: "#64748b",
        }}
      >
        <div>Capstone Research Prototype</div>
        <div>v1.0.0 • Python / React / SQLite</div>
      </div>
    </aside>
  );
}
