import React, { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';
import { Card } from 'react-bootstrap';

const RealTimeChart = ({ data }) => {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (chartRef.current && data) {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      const ctx = chartRef.current.getContext('2d');
      chartInstance.current = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.map((_, index) => `T${index}`),
          datasets: [
            {
              label: 'Valeur du capteur',
              data: data.map(item => item.value),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.2)',
              tension: 0.3,
              fill: true,
            },
          ],
        },
        options: {
          responsive: true,
          scales: {
            y: {
              beginAtZero: true,
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <Card className="mb-4 shadow">
      <Card.Header className="bg-primary text-white">Graphique en Temps Réel</Card.Header>
      <Card.Body>
        <canvas ref={chartRef}></canvas>
      </Card.Body>
    </Card>
  );
};

export default RealTimeChart;
