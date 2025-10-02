import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const RealTimeMetrics = ({ metric, value, previousValue, label, icon: Icon, color = 'blue' }) => {
  const [displayValue, setDisplayValue] = useState(value);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (value !== displayValue) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setDisplayValue(value);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [value]);

  const getTrend = () => {
    if (!previousValue || previousValue === value) return { icon: Minus, color: 'text-gray-500', text: 'No change' };
    if (value > previousValue) {
      const increase = ((value - previousValue) / previousValue * 100).toFixed(1);
      return { icon: TrendingUp, color: 'text-green-600', text: `+${increase}%` };
    }
    const decrease = ((previousValue - value) / previousValue * 100).toFixed(1);
    return { icon: TrendingDown, color: 'text-red-600', text: `-${decrease}%` };
  };

  const trend = getTrend();
  const TrendIcon = trend.icon;

  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200'
  };

  return (
    <div className={`relative overflow-hidden rounded-lg border-2 ${colorClasses[color]} p-6 transition-all duration-300 ${isAnimating ? 'scale-105' : 'scale-100'}`}>
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-current animate-pulse"></div>
        <div className="absolute -bottom-4 -left-4 w-32 h-32 rounded-full bg-current animate-pulse delay-700"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-lg ${colorClasses[color]} bg-opacity-20`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider opacity-80">{metric}</p>
              <p className="text-sm font-medium">{label}</p>
            </div>
          </div>
          {isAnimating && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent"></div>
          )}
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className={`text-3xl font-bold transition-all duration-500 ${isAnimating ? 'opacity-50' : 'opacity-100'}`}>
              {typeof displayValue === 'number' ? displayValue.toLocaleString() : displayValue}
            </p>
          </div>
          <div className={`flex items-center space-x-1 text-sm ${trend.color}`}>
            <TrendIcon className="h-4 w-4" />
            <span className="font-medium">{trend.text}</span>
          </div>
        </div>

        {/* Live Indicator */}
        <div className="absolute top-2 right-2 flex items-center space-x-1">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
          <span className="text-xs opacity-60">LIVE</span>
        </div>
      </div>
    </div>
  );
};

export default RealTimeMetrics;
