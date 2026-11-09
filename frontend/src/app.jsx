import React, { useState } from "react";

import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";

import Dashboard from "./pages/Dashboard";
import Donors from "./pages/Donors";
import Organs from "./pages/Organs";
import Recipients from "./pages/Recipients";
import Matching from "./pages/Matching";
import Explainability from "./pages/explainability";
import Logistics from "./pages/logistics";
import Optimization from "./pages/optimization";
import Scenarios from "./pages/scenarios";
import ProfessionalReview from "./pages/ProfessionalReview";
import ModelEvaluation from "./pages/modelevaluation";
import FairnessAssessment from "./pages/fairnessassessment";
import Notifications from "./pages/notifications";

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [selectedOrganId, setSelectedOrganId] = useState("");

  const pageTitles = {
    dashboard: "Dashboard",
    donors: "Donor Management",
    organs: "Organ Management",
    recipients: "Recipient Management",
    matching: "Matching Engine",
    explainability: "Explainability",
    logistics: "Logistics & Routes",
    optimization: "Multi-Organ Optimization",
    scenarios: "What-If Scenarios",
    review: "Professional Review",
    model_eval: "Model Evaluation",
    fairness: "Fairness Assessment",
    notifications: "Notifications",
  };

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard setActivePage={setActivePage} />;

      case "donors":
        return <Donors />;

      case "organs":
        return (
          <Organs
            setActivePage={setActivePage}
            setSelectedOrganId={setSelectedOrganId}
          />
        );

      case "recipients":
        return <Recipients />;

      case "matching":
        return <Matching selectedOrganId={selectedOrganId} />;
      case "explainability":
        return <Explainability/>;
      case "logistics":
        return <Logistics />;
      case "optimization":
        return <Optimization />;
      case "scenarios":
        return <Scenarios />;
      case "review":
        return <ProfessionalReview />;
      case "model_eval":
        return <ModelEvaluation />;
      case "fairness":
        return <FairnessAssessment />;
      case "notifications":
        return <Notifications />;

      default:
        return (
          <div className="page-content">
            <h2>Page Not Found</h2>
            <p>The selected module could not be loaded.</p>
          </div>
        );
    }
  };

  return (
    <div className="app-container">

      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="main-content">

        <Navbar
          activeTitle={pageTitles[activePage] || "OrganMatch AI"}
          onOpenNotifications={() => setActivePage("notifications")}
        />


        <main className="page-body">
          {renderPage()}
        </main>

      </div>

    </div>
  );
}

export default App;
