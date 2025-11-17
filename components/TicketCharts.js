'use client';

import { useMemo } from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line
} from 'recharts';

// --- Color Palettes ---
// Based on your KPI colors
const STATUS_COLORS = {
  open: '#3b82f6', // blue-500
  in_progress: '#f59e0b', // amber-500
  resolved: '#8b5cf6', // violet-500
  closed: '#22c55e', // emerald-500
  unknown: '#64748b' // slate-500
};

const IMPACT_COLORS = {
  critical: '#ef4444', // red-500
  high: '#f97316', // orange-500
  medium: '#f59e0b', // amber-500
  low: '#22c55e', // emerald-500
  minor: '#22c55e', // emerald-500 (maps to low)
  unknown: '#64748b' // slate-500
};

// A simple color generator for categories
const CATEGORY_COLORS = [
  '#3b82f6', '#ef4444', '#f59e0b', '#22c55e', '#8b5cf6', '#ec4899', '#14b8a6',
  '#6366f1', '#d946ef', '#0891b2'
];

// --- 1. Added 'show' prop with defaults ---
const defaultShow = {
  status: true,
  impact: true,
  agent: true,
  department: true,
  category: true,
  time: true,
};

export default function TicketCharts({ tickets = [], theme = 'dark', show: showProps = {} }) {
  
  // Merge default show flags with passed props
  const show = { ...defaultShow, ...showProps };

  // --- Theme Styles ---
  const isDark = theme === 'dark';
  const cardBg = isDark
    ? 'rounded-xl border border-white/15 bg-white/5'
    : 'rounded-xl border border-slate-200 bg-white';
  const cardTitle = isDark ? 'text-white' : 'text-slate-900';
  const textSub = isDark ? 'text-white/80' : 'text-slate-600';
  
  // Recharts text color
  const tickColor = isDark ? '#f1f5f9' : '#334155'; // Text for axes
  const tooltipBg = isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.8)'; // Tooltip background
  const tooltipBorder = isDark ? '#475569' : '#cbd5e1';
  
  // --- Data Processing ---
  const processedData = useMemo(() => {
    const statusCounts = {};
    const categoryCounts = {};
    const impactCounts = {};
    const overTimeCounts = {};
    const departmentCounts = {}; 
    const agentCounts = {}; // <-- Added new counter for agents

    for (const t of tickets) {
      // 1. Count by Status
      const status = (t.status || 'unknown').toLowerCase();
      statusCounts[status] = (statusCounts[status] || 0) + 1;

      // 2. Count by Category
      const category = t.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      
      // 3. Count by Impact
      const impact = (t.impact || 'unknown').toLowerCase();
      impactCounts[impact] = (impactCounts[impact] || 0) + 1;

      // 4. Count by Date
      try {
        const date = new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        overTimeCounts[date] = (overTimeCounts[date] || 0) + 1;
      } catch (e) {
        // Invalid date
      }
      
      // 5. Count by Department
      const dept = t.customer_department || 'Unknown';
      departmentCounts[dept] = (departmentCounts[dept] || 0) + 1;

      // 6. Count by Agent (NEW)
      const agentName = (t.agent_first_name || t.agent_last_name) 
        ? `${t.agent_first_name || ''} ${t.agent_last_name || ''}`.trim()
        : 'Unassigned';
      agentCounts[agentName] = (agentCounts[agentName] || 0) + 1;
    }

    // Map to recharts format
    const statusData = Object.entries(statusCounts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
    
    const categoryData = Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value); // Sort descending
      
    const impactData = Object.entries(impactCounts).map(([name, value]) => ({ 
      name: name.charAt(0).toUpperCase() + name.slice(1), 
      value 
    }));
    
    const overTimeData = Object.entries(overTimeCounts)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort by date
      
    const departmentData = Object.entries(departmentCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // 7. Format agent data (NEW)
    const agentData = Object.entries(agentCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    return { statusData, categoryData, impactData, overTimeData, departmentData, agentData }; // <-- 8. Added to return
    
  }, [tickets]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      
      {/* --- 2. Wrapped charts in 'show' prop conditionals --- */}
      
      {/* --- Chart 1: Tickets by Status (Pie Chart) --- */}
      {show.status && (
        <div className={`${cardBg} p-4`}>
          <h3 className={`text-lg font-semibold ${cardTitle} mb-2`}>Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedData.statusData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
              >
                {processedData.statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name.toLowerCase()] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: tooltipBg, backdropFilter: 'blur(4px)', borderRadius: '0.5rem', borderColor: tooltipBorder }} 
                itemStyle={{ color: tickColor }} 
              />
              <Legend wrapperStyle={{ color: tickColor }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}
      
      {/* --- Chart 2: Tickets by Impact (Pie Chart) --- */}
      {show.impact && (
        <div className={`${cardBg} p-4`}>
          <h3 className={`text-lg font-semibold ${cardTitle} mb-2`}>Tickets by Impact</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={processedData.impactData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
              >
                {processedData.impactData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={IMPACT_COLORS[entry.name.toLowerCase()] || '#64748b'} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ background: tooltipBg, backdropFilter: 'blur(4px)', borderRadius: '0.5rem', borderColor: tooltipBorder }} 
                itemStyle={{ color: tickColor }} 
              />
              <Legend wrapperStyle={{ color: tickColor }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* --- NEW CHART: Tickets per Agent (Bar Chart) --- */}
      {show.agent && (
        <div className={`${cardBg} p-4 lg:col-span-2`}>
          <h3 className={`text-lg font-semibold ${cardTitle} mb-2`}>Tickets per Agent</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.agentData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#e2e8f0'} />
              <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12, dx: -5 }} allowDecimals={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke={tickColor} 
                width={100} 
                tick={{ fill: tickColor, fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ background: tooltipBg, backdropFilter: 'blur(4px)', borderRadius: '0.5rem', borderColor: tooltipBorder }} 
                itemStyle={{ color: tickColor }} 
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" name="Tickets" fill="#8884d8">
                {processedData.agentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* --- Tickets by Department (Bar Chart) --- */}
      {show.department && (
        <div className={`${cardBg} p-4 lg:col-span-2`}>
          <h3 className={`text-lg font-semibold ${cardTitle} mb-2`}>Tickets by Department</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.departmentData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#e2e8f0'} />
              <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12, dx: -5 }} allowDecimals={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke={tickColor} 
                width={100} 
                tick={{ fill: tickColor, fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ background: tooltipBg, backdropFilter: 'blur(4px)', borderRadius: '0.5rem', borderColor: tooltipBorder }} 
                itemStyle={{ color: tickColor }} 
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" name="Tickets" fill="#8884d8">
                {processedData.departmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[(index + 1) % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* --- Tickets by Category (Bar Chart) --- */}
      {show.category && (
        <div className={`${cardBg} p-4 lg:col-span-2`}>
          <h3 className={`text-lg font-semibold ${cardTitle} mb-2`}>Tickets by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={processedData.categoryData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#e2e8f0'} />
              <XAxis type="number" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12, dx: -5 }} allowDecimals={false} />
              <YAxis 
                type="category" 
                dataKey="name" 
                stroke={tickColor} 
                width={100} 
                tick={{ fill: tickColor, fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{ background: tooltipBg, backdropFilter: 'blur(4px)', borderRadius: '0.5rem', borderColor: tooltipBorder }} 
                itemStyle={{ color: tickColor }} 
                cursor={{ fill: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="value" name="Tickets" fill="#8884d8">
                {processedData.categoryData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* --- Tickets Over Time (Line Chart) --- */}
      {show.time && (
        <div className={`${cardBg} p-4 lg:col-span-2`}>
          <h3 className={`text-lg font-semibold ${cardTitle} mb-2`}>New Tickets Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={processedData.overTimeData}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#475569' : '#e2e8f0'} />
              <XAxis dataKey="date" stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} />
              <YAxis stroke={tickColor} tick={{ fill: tickColor, fontSize: 12 }} allowDecimals={false} />
              <Tooltip 
                contentStyle={{ background: tooltipBg, backdropFilter: 'blur(4px)', borderRadius: '0.5rem', borderColor: tooltipBorder }} 
                itemStyle={{ color: tickColor }} 
              />
              <Line type="monotone" dataKey="count" name="New Tickets" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

    </div>
  );
}