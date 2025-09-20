import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CoursePerformanceBarChart({ data }) {
  const chartData = {
    labels: data.map(item => item.courseName),
    datasets: [
      {
        label: 'Overall Attendance Rate (%)',
        data: data.map(item => {
          const totalPossible = item.totalStudentsInCourse * item.totalSessions;
          return totalPossible > 0 ? ((item.presentCount / totalPossible) * 100).toFixed(1) : 0;
        }),
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: 'y', // Horizontal bar chart
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: 'Attendance Rate by Course',
        color: 'rgb(var(--foreground-rgb))',
        font: {
          size: 18
        }
      },
    },
    scales: {
      x: {
        ticks: { color: 'rgb(var(--foreground-rgb))' },
        grid: { color: 'rgba(var(--foreground-rgb), 0.1)' },
        max: 100,
      },
      y: {
        ticks: { color: 'rgb(var(--foreground-rgb))' },
        grid: { color: 'rgba(var(--foreground-rgb), 0.1)' },
      },
    },
  };

  return <Bar data={chartData} options={options} />;
}
