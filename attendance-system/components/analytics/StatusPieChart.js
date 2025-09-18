
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

export default function StatusPieChart({ data }) { // data is the statusBreakdown array
  const chartData = {
    labels: data.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)), // Capitalize status
    datasets: [
      {
        label: '# of Students',
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.6)', // Present
          'rgba(255, 206, 86, 0.6)', // Late
          'rgba(255, 99, 132, 0.6)', // Absent (for future use)
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

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Attendance Status Breakdown (Present vs. Late)',
      },
    },
  };

  return <Pie data={chartData} options={options} />;
}
