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
  const totalSubscriptionsByMonth = { January: 40, February: 100, March: 70 };
  const activeSubscriptionsByType = { Basic: 80, Standard: 120, Premium: 50 };
  const usersByLanguage = { English: 200, Spanish: 100, French: 50 };
  const profilesPerAccount = { "1 Profile": 70, "2 Profiles": 90, "3 Profiles": 30, "4 Profiles": 10 };
  const mostCommonAgeRestriction = { "18+": 120, "16+": 50, "12+": 30 };

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

  // Prepare data for the Active Subscriptions by Type bar graph
  const typeLabels = Object.keys(activeSubscriptionsByType);
  const typeValues = Object.values(activeSubscriptionsByType);

  const typeData = {
    labels: typeLabels,
    datasets: [
      {
        label: "Number of Subscriptions",
        data: typeValues,
        backgroundColor: [
          "rgba(255, 205, 86, 0.2)",
          "rgba(54, 162, 235, 0.2)",
          "rgba(255, 99, 132, 0.2)",
        ],
        borderColor: [
          "rgba(255, 205, 86, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 99, 132, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const typeOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Active Subscriptions by Type",
      },
    },
  };

  // Prepare data for the Users by Language bar graph
  const languageLabels = Object.keys(usersByLanguage);
  const languageValues = Object.values(usersByLanguage);

  const languageData = {
    labels: languageLabels,
    datasets: [
      {
        label: "Number of Users",
        data: languageValues,
        backgroundColor: [
          "rgba(153, 102, 255, 0.2)",
          "rgba(255, 159, 64, 0.2)",
          "rgba(54, 162, 235, 0.2)",
        ],
        borderColor: [
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(54, 162, 235, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const languageOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Users by Language",
      },
    },
  };

  // Prepare data for the Profiles Per Account bar graph
  const profileLabels = Object.keys(profilesPerAccount);
  const profileValues = Object.values(profilesPerAccount);

  const profileData = {
    labels: profileLabels,
    datasets: [
      {
        label: "Number of Profiles",
        data: profileValues,
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

  const profileOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Profiles Per Account",
      },
    },
  };

  // Prepare data for the Most Common Age Restriction bar graph
  const restrictionLabels = Object.keys(mostCommonAgeRestriction);
  const restrictionValues = Object.values(mostCommonAgeRestriction);

  const restrictionData = {
    labels: restrictionLabels,
    datasets: [
      {
        label: "Number of Users",
        data: restrictionValues,
        backgroundColor: [
          "rgba(255, 159, 64, 0.2)",
          "rgba(153, 102, 255, 0.2)",
          "rgba(75, 192, 192, 0.2)",
        ],
        borderColor: [
          "rgba(255, 159, 64, 1)",
          "rgba(153, 102, 255, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
      },
    ],
  };

  const restrictionOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: "top",
      },
      title: {
        display: true,
        text: "Most Common Age Restriction",
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

        {/* Active Subscriptions by Type */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "600px" }}>
          <Bar data={typeData} options={typeOptions} />
        </div>

        {/* Users by Language */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "600px" }}>
          <Bar data={languageData} options={languageOptions} />
        </div>

        {/* Profiles Per Account */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "600px" }}>
          <Bar data={profileData} options={profileOptions} />
        </div>

        {/* Most Common Age Restriction */}
        <div style={{ border: "1px solid #ccc", padding: "10px", width: "600px" }}>
          <Bar data={restrictionData} options={restrictionOptions} />
        </div>
      </div>
    </div>
  );
};

export default StatisticsPage;
