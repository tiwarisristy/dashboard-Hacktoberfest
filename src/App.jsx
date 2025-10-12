// src/App.jsx
import React from 'react';
import { Bar } from 'react-chartjs-2';
// Import necessary components from chart.js and react-chartjs-2
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import './index.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const App = () => {
  // Define data and options directly here
  const data = {
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Screen Time (hours)',
      data: [7.5, 6.2, 8.1, 5.9, 9.3, 11.0, 10.5],
      backgroundColor: 'rgba(75, 192, 192, 0.6)',
      borderColor: 'rgba(75, 192, 192, 1)',
      borderWidth: 1,
    }],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Weekly Screen Time' },
    },
    scales: { y: { beginAtZero: true } },
  };

  return (
    <div className="dashboard">
      <h1>Screen Time Dashboard</h1>
      <div className="chart-container">
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default App;