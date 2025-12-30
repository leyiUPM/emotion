"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";

export function DistributionBar({
  data,
}: {
  data: Array<{ label: string; count: number }>;
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 12 }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis tick={{ fontSize: 12 }} />

          <Tooltip
            cursor={{ fill: "rgba(139, 92, 246, 0.12)" }} // hover background highlight
            contentStyle={{
              background: "rgba(12, 14, 24, 0.92)",
              border: "1px solid rgba(255,255,255,0.10)",
              borderRadius: 14,
              boxShadow: "0 12px 30px rgba(0,0,0,0.35)",
              backdropFilter: "blur(10px)",
            }}
            labelStyle={{ color: "rgba(255,255,255,0.88)", fontWeight: 600 }}
            itemStyle={{ color: "#FBBF24", fontWeight: 700 }} // count color
          />

          <Bar
            dataKey="count"
            fill="#22D3EE"              // bar color (cyan)
            radius={[10, 10, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function TrendLines({
  data,
  labels,
}: {
  data: Array<Record<string, number>>;
  labels: string[];
}) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="i" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Legend />
          {labels.map((label) => (
            <Line key={label} type="monotone" dataKey={label} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LatencyLine({ data }: { data: Array<{ i: number; latency: number }> }) {
  return (
    <div className="h-56 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
          <XAxis dataKey="i" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Line type="monotone" dataKey="latency" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
