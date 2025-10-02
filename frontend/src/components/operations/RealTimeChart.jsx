import React, { useEffect, useRef } from 'react';

const RealTimeChart = ({ data, title, color = 'blue', type = 'line' }) => {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const drawChart = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      const padding = 20;
      const chartWidth = canvas.width - padding * 2;
      const chartHeight = canvas.height - padding * 2;
      
      // Find min and max values
      const values = data.map(d => d.value);
      const maxValue = Math.max(...values);
      const minValue = Math.min(...values);
      const valueRange = maxValue - minValue || 1;
      
      // Set colors based on prop
      const colors = {
        blue: '#3B82F6',
        green: '#10B981',
        red: '#EF4444',
        yellow: '#F59E0B',
        purple: '#8B5CF6'
      };
      const chartColor = colors[color] || colors.blue;
      
      if (type === 'line') {
        // Draw line chart
        ctx.beginPath();
        ctx.strokeStyle = chartColor;
        ctx.lineWidth = 2;
        
        data.forEach((point, index) => {
          const x = padding + (index / (data.length - 1)) * chartWidth;
          const y = canvas.height - padding - ((point.value - minValue) / valueRange) * chartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        
        ctx.stroke();
        
        // Draw gradient fill
        const gradient = ctx.createLinearGradient(0, padding, 0, canvas.height - padding);
        gradient.addColorStop(0, chartColor + '40');
        gradient.addColorStop(1, chartColor + '10');
        
        ctx.beginPath();
        data.forEach((point, index) => {
          const x = padding + (index / (data.length - 1)) * chartWidth;
          const y = canvas.height - padding - ((point.value - minValue) / valueRange) * chartHeight;
          
          if (index === 0) {
            ctx.moveTo(x, canvas.height - padding);
            ctx.lineTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();
        
        // Draw points
        ctx.fillStyle = chartColor;
        data.forEach((point, index) => {
          const x = padding + (index / (data.length - 1)) * chartWidth;
          const y = canvas.height - padding - ((point.value - minValue) / valueRange) * chartHeight;
          
          ctx.beginPath();
          ctx.arc(x, y, 3, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (type === 'bar') {
        // Draw bar chart
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;
        
        data.forEach((point, index) => {
          const x = padding + index * (barWidth + barSpacing);
          const barHeight = ((point.value - minValue) / valueRange) * chartHeight;
          const y = canvas.height - padding - barHeight;
          
          // Draw bar
          ctx.fillStyle = chartColor + '80';
          ctx.fillRect(x, y, barWidth, barHeight);
          
          // Draw bar border
          ctx.strokeStyle = chartColor;
          ctx.lineWidth = 1;
          ctx.strokeRect(x, y, barWidth, barHeight);
        });
      }
      
      // Draw axes
      ctx.strokeStyle = '#E5E7EB';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(padding, padding);
      ctx.lineTo(padding, canvas.height - padding);
      ctx.lineTo(canvas.width - padding, canvas.height - padding);
      ctx.stroke();
      
      // Draw title
      ctx.fillStyle = '#6B7280';
      ctx.font = '12px sans-serif';
      ctx.fillText(title, padding, padding - 5);
      
      // Draw value labels
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px sans-serif';
      ctx.fillText(maxValue.toFixed(0), padding - 15, padding + 5);
      ctx.fillText(minValue.toFixed(0), padding - 15, canvas.height - padding);
    };

    drawChart();

    // Animate new data points
    const animate = () => {
      drawChart();
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation for smooth updates
    if (data.length > 0) {
      animate();
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [data, title, color, type]);

  return (
    <canvas 
      ref={canvasRef} 
      className="w-full h-full"
      style={{ minHeight: '150px' }}
    />
  );
};

export default RealTimeChart;
