// src/components/analytics/HistoryGraph.js
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function HistoryGraph({ data }) {
  const chartData = {
    labels: data.map(item => item.sessionName),
    datasets: [
      {
        label: 'Attendance',
        data: data.map(item => (item.attended ? 1 : 0)), // 1 for attended, 0 for missed
        fill: false,
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            if (value === 1) return 'Present';
            if (value === 0) return 'Absent';
            return null;
          }
        },
        max: 1.1,
        min: -0.1,
      }
    },
    plugins: {
      legend: {
        display: false,
      },
    },
  };

  const containerStyles = {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    padding: '1.5rem',
  };

  return (
    <div style={containerStyles}>
      <h3 style={{marginBottom: '1rem'}}>Recent Session History</h3>
      <Line data={chartData} options={options} />
    </div>
  );
}
