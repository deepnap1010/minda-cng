import React from "react";
import { Timer, TimerReset, TimerOff } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const DonutChart = ({ runTime = 0, stopTime = 0, idleTime = 0 }) => {
  const data = [
    { name: "Run Time", value: runTime, color: "#5fad57" },
    { name: "Idle Time", value: idleTime, color: "#e6c245" },
    { name: "Stop Time", value: stopTime, color: "#db4d3d" },
  ];

  const totalMinutes = data.reduce((sum, item) => sum + item.value, 0);

  const formatDuration = (totalMins) => {
    const hours = Math.floor(totalMins / 60);
    const minutes = totalMins % 60;
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes} min`;
  };

  return (
    <div className="w-full bg-gradient-to-br from-slate-50 mt-5 to-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <div className="flex flex-col lg:flex-row items-center lg:items-start justify-between gap-8 lg:gap-8">
        {/* Left - Status Cards */}
        <div className="w-full lg:w-auto space-y-6 min-w-[380px]">
          {data.map((item, index) => (
            <div
              key={item.name}
              className="bg-white rounded-xl border border-slate-100 shadow-sm p-4 flex items-center gap-4 transition-all hover:shadow-md hover:scale-[1.01]"
            >
              <div
                className="rounded-full p-3"
                style={{ backgroundColor: `${item.color}15` }}
              >
                {index === 0 && (
                  <Timer size={32} strokeWidth={2.5} color={item.color} />
                )}
                {index === 1 && (
                  <TimerReset size={32} strokeWidth={2.5} color={item.color} />
                )}
                {index === 2 && (
                  <TimerOff size={32} strokeWidth={2.5} color={item.color} />
                )}
              </div>

              <div className="flex-1">
                <div className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  {item.name}
                </div>
                <div
                  className="text-2xl font-bold mt-0.5"
                  style={{ color: item.color }}
                >
                  {formatDuration(item.value)}
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs text-slate-400">
                  {totalMinutes > 0 ? ((item.value / totalMinutes) * 100).toFixed(0) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Center - Donut Chart */}
        <div className="w-full max-w-[360px] aspect-square relative">
          <ResponsiveContainer width="100%" height="80%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius="75%"
                outerRadius="92%"
                paddingAngle={4}
                cornerRadius={8}
                dataKey="value"
                startAngle={90}
                endAngle={-270}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color}
                    stroke="#fff"
                    strokeWidth={2}
                  />
                ))}
              </Pie>

              {/* Center content */}
              <text
                x="50%"
                y="45%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-xs font-medium fill-slate-500"
              >
                Total Time
              </text>
              <text
                x="50%"
                y="55%"
                textAnchor="middle"
                dominantBaseline="middle"
                className="text-2xl font-bold fill-slate-800"
              >
                {formatDuration(totalMinutes)}
              </text>
            </PieChart>
          </ResponsiveContainer>

          {/* Floating legend below chart */}
          <div className="absolute mt-2 left-0 right-0 flex justify-center gap-6">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs font-medium text-slate-600">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right - Percentage breakdown (optional elegant style) */}
        {/* <div className="w-full lg:w-auto hidden lg:block">
          <div className="space-y-5">
            {data.map((item) => (
              <div key={item.name} className="flex items-center gap-4">
                <div
                  className="w-4 h-4 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-700">
                    {item.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {item.value} min •{" "}
                    {((item.value / totalMinutes) * 100).toFixed(1)}%
                  </div>
                </div>
                <div
                  className="text-right text-sm font-semibold"
                  style={{ color: item.color }}
                >
                  {((item.value / totalMinutes) * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div> */}
      </div>
    </div>
  );
};

export default DonutChart;
