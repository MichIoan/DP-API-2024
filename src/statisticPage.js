import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const StatisticsPage = () => {
  // Mock data (replace with API data when connected)
  const ageDistribution = { "18-25": 150, "26-35": 100, "36-45": 50, "46+": 20 };
  const totalSubscriptionsByMonth = { January: 40, February: 60, March: 70 };

  // Prepare data for the Age Distribution bar graph
  const ageLabels = Object.keys(ageDistribution);
  const ageValues = Object.values(ageDistribution);

  const ageData = {
    labels: ageLabels,
    datasets: [
      {
        label: "Number of Users",
        data: ageValues,
        backgroundColor: [
          "rgba(255, 99, 132, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 206, 86, 0.2)",
          "rgba(75, 192, 192, 0.2)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const ageOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Age Distribution",
      },
    },
  };

  // Prepare data for the Subscriptions by Month bar graph
  const monthLabels = Object.keys(totalSubscriptionsByMonth);
  const monthValues = Object.values(totalSubscriptionsByMonth);

  const subscriptionData = {
    labels: monthLabels,
    datasets: [
      {
        label: "Number of Subscriptions",
        data: monthValues,
        backgroundColor: [
          "rgba(75, 192, 192, 0.2)",
          "rgba(255, 159, 64, 0.2)",
          "rgba(153, 102, 255, 0.2)",
        ],
        borderColor: [
          "rgba(75, 192, 192, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(153, 102, 255, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const subscriptionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Subscriptions by Month",
      },
    },
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <h1 style={{ textAlign: "center" }}>Netflix Statistics</h1>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "20px", justifyContent: "center" }}>
        {/* Age Distribution */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "600px" }}>
          <Bar data={ageData} options={ageOptions} />
        </div>

        {/* Subscriptions by Month */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "600px" }}>
          <Bar data={subscriptionData} options={subscriptionOptions} />
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;



/*import React from "react";

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
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Age Distribution</h2>
          <ul>
            {Object.entries(ageDistribution).map(([ageRange, count]) => (
              <li key={ageRange}>{`${ageRange}: ${count}`}</li>
            ))}
          </ul>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Subscriptions by Month</h2>
          <ul>
            {Object.entries(totalSubscriptionsByMonth).map(([month, count]) => (
              <li key={month}>{`${month}: ${count}`}</li>
            ))}
          </ul>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Active Subscriptions by Type</h2>
          <ul>
            {Object.entries(activeSubscriptionsByType).map(([type, count]) => (
              <li key={type}>{`${type}: ${count}`}</li>
            ))}
          </ul>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Users by Language</h2>
          <ul>
            {Object.entries(usersByLanguage).map(([language, count]) => (
              <li key={language}>{`${language}: ${count}`}</li>
            ))}
          </ul>
        </div>

        <div style={{ border: "1px solid #ccc", padding: "10px", width: "300px" }}>
          <h2>Profiles Per Account</h2>
          <ul>
            {Object.entries(profilesPerAccount).map(([profiles, count]) => (
              <li key={profiles}>{`${profiles}: ${count}`}</li>
            ))}
          </ul>
        </div>

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
*/