import React from "react";

const StatisticsPage = () => {
  // Mock data (replace with API data when connected)
  const ageDistribution = { "18-25": 150, "26-35": 100, "36-45": 50, "46+": 20 };
  const totalSubscriptionsByMonth = { January: 40, February: 60, March: 70 };
  const activeSubscriptionsByType = { Basic: 80, Standard: 120, Premium: 50 };
  const usersByLanguage = { English: 200, Spanish: 100, French: 50 };
  const profilesPerAccount = { "1 Profile": 70, "2 Profiles": 90, "3 Profiles": 30, "4 Profiles": 10 };
  const mostCommonAgeRestriction = { "18+": 120, "16+": 50, "12+": 30 };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Netflix Statistics</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
        {/* Age Distribution */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Age Distribution</h2>
          <ul>
            {Object.entries(ageDistribution).map(([ageRange, count]) => (
              <li key={ageRange}>{`${ageRange}: ${count}`}</li>
            ))}
          </ul>
        </div>

        {/* Subscriptions by Month */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Subscriptions by Month</h2>
          <ul>
            {Object.entries(totalSubscriptionsByMonth).map(([month, count]) => (
              <li key={month}>{`${month}: ${count}`}</li>
            ))}
          </ul>
        </div>

        {/* Active Subscriptions by Type */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Active Subscriptions by Type</h2>
          <ul>
            {Object.entries(activeSubscriptionsByType).map(([type, count]) => (
              <li key={type}>{`${type}: ${count}`}</li>
            ))}
          </ul>
        </div>

        {/* Users by Language */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Users by Language</h2>
          <ul>
            {Object.entries(usersByLanguage).map(([language, count]) => (
              <li key={language}>{`${language}: ${count}`}</li>
            ))}
          </ul>
        </div>

        {/* Profiles Per Account */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Profiles Per Account</h2>
          <ul>
            {Object.entries(profilesPerAccount).map(([profiles, count]) => (
              <li key={profiles}>{`${profiles}: ${count}`}</li>
            ))}
          </ul>
        </div>

        {/* Most Common Age Restriction */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Most Common Age Restriction</h2>
          <ul>
            {Object.entries(mostCommonAgeRestriction).map(([restriction, count]) => (
              <li key={restriction}>{`${restriction}: ${count}`}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
