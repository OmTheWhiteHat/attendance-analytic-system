import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function DepartmentPieChart({ data }) {
  const chartData = {
    labels: data.map(item => item.name),
    datasets: [
      {
        label: 'Total Attendances',
        data: data.map(item => item.count),
        backgroundColor: [
          'rgba(75, 192, 192, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: '#fff',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: 'rgb(var(--foreground-rgb))'
        }
      },
      title: {
        display: true,
        text: 'Attendance by Department',
        color: 'rgb(var(--foreground-rgb))',
        font: {
          size: 18
        }
      },
    },
  };

  return <Doughnut data={chartData} options={options} />;
}
