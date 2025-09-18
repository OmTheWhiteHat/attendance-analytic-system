
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function AttendanceChart({ data }) { // data is the attendanceByCourse array
  const chartData = {
    labels: data.map(item => item.courseName),
    datasets: [
      {
        label: 'Students Present',
        data: data.map(item => item.presentCount),
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      // Optionally, you can add a second bar for total students
      {
        label: 'Total Enrolled Students',
        data: data.map(item => item.totalStudentsInCourse),
        backgroundColor: 'rgba(201, 203, 207, 0.6)',
        borderColor: 'rgba(201, 203, 207, 1)',
        borderWidth: 1,
      }
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
        text: 'Attendance Count per Course',
      },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1, // Ensure y-axis has integer steps
            }
        }
    }
  };

  return <Bar options={options} data={chartData} />;
}
