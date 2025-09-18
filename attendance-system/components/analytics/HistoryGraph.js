
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

export default function HistoryGraph({ data }) { // data is the attendanceHistory array
  const chartData = {
    labels: data.map(item => item.sessionName),
    datasets: [
      {
        label: 'Attendance Status',
        data: data.map(item => item.attended ? 1 : 0.1), // 1 for present, 0.1 for absent
        backgroundColor: data.map(item => item.attended ? 'rgba(75, 192, 192, 0.6)' : 'rgba(255, 99, 132, 0.6)'),
        borderColor: data.map(item => item.attended ? 'rgba(75, 192, 192, 1)' : 'rgba(255, 99, 132, 1)'),
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false, // No need for a legend with only one dataset
      },
      title: {
        display: true,
        text: 'Attendance History (Last 20 Sessions)',
      },
      tooltip: {
        callbacks: {
            label: function(context) {
                return context.raw > 0.5 ? 'Status: Present' : 'Status: Absent';
            }
        }
      }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1,
                callback: function(value) {
                    if (value === 1) return 'Present';
                    if (value === 0) return 'Absent';
                    return '';
                }
            }
        },
        x: {
            display: false, // Hide session names on x-axis to keep it clean
        }
    }
  };

  return <Bar options={options} data={chartData} />;
}
