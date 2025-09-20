// src/components/analytics/StatusPieChart.js
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function StatusPieChart({ data }) {
  const chartData = {
    labels: data.map(item => item._id), // e.g., ['present', 'late', 'absent']
    datasets: [
      {
        label: 'Attendance Status',
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)',
          'rgba(255, 206, 86, 0.6)',
          'rgba(255, 99, 132, 0.6)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const containerStyles = {
    backgroundColor: '#f9f9f9',
    border: '1px solid #eaeaea',
    borderRadius: '8px',
    padding: '1.5rem',
  };

  return (
    <div style={containerStyles}>
      <h3 style={{marginBottom: '1rem'}}>Attendance Breakdown</h3>
      <Pie data={chartData} />
    </div>
  );
}
