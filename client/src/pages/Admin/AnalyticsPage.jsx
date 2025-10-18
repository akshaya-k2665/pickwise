// p4/client/src/pages/Admin/AnalyticsPage.jsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../../api"; // ✅ configured Axios instance (with token)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import "../../styles/AdminAnalytics.css";

function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Mock sample data (used until backend supplies data)
  const mockLoginsPerDay = useMemo(
    () => [
      { date: "Mon", count: 12 },
      { date: "Tue", count: 18 },
      { date: "Wed", count: 9 },
      { date: "Thu", count: 22 },
      { date: "Fri", count: 15 },
      { date: "Sat", count: 27 },
      { date: "Sun", count: 19 },
    ],
    []
  );

  const mockTotals = useMemo(
    () => ({ totalUsers: 1200, newSignups: 45 }),
    []
  );

  // role distribution chart removed

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        const res = await API.get("/admin/analytics"); // ✅ endpoint
        // Support both legacy and new shapes
        // New: { success: true, data: { ... } }
        // Old: { totals: {...}, loginsThisWeek, signups }
        const body = res?.data ?? null;
        const payload = body?.data ?? body; // unwrap if new shape
        setAnalytics(payload);
      } catch (err) {
        console.error("❌ Failed to fetch analytics:", err);
        setError("Failed to load analytics. Make sure you are logged in as admin.");
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, []);

  if (loading) return <p style={{ color: "white" }}>⏳ Loading analytics...</p>;

  // Prepare data for charts, using analytics if present, otherwise mock data
  const rawDaily = analytics?.loginsPerDay || analytics?.loginsDaily;
  const loginsPerDay = Array.isArray(rawDaily) && rawDaily.length
    ? rawDaily.map((d) => ({
        date: d.dateLabel || d.date || d.day || "",
        count: Number(d.count ?? 0),
      }))
    : mockLoginsPerDay;

  const totals = {
    totalUsers:
      analytics?.totals?.users ?? analytics?.totalUsers ?? mockTotals.totalUsers,
    newSignups:
      analytics?.signupsThisWeek ?? analytics?.signups ?? analytics?.newSignups ?? mockTotals.newSignups,
  };

  const barData = [
    { label: "Total Users", value: Number(totals.totalUsers ?? 0) },
    { label: "New Signups", value: Number(totals.newSignups ?? 0) },
  ];

  // role distribution removed

  // pie colors removed

  return (
    <div className="analytics-page">
      <button
        onClick={() => navigate("/admin")}
        className="analytics-back"
      >
        ← Back to Admin Dashboard
      </button>

      <h2 className="analytics-title">📊 Analytics Overview</h2>

      {error && <p className="analytics-error">{error}</p>}

      <div className="analytics-grid">
        {/* Line Chart: Logins per day */}
        <div className="glass-card">
          <h3 className="card-title">Daily Logins (7 days)</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={loginsPerDay} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="lineColor" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e50914" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#e50914" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                <XAxis dataKey="date" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", color: "#fff" }} />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="url(#lineColor)"
                  strokeWidth={3}
                  dot={{ r: 3, stroke: "#e50914", strokeWidth: 1, fill: "#111" }}
                  activeDot={{ r: 6 }}
                  isAnimationActive={true}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart: Totals vs Signups */}
        <div className="glass-card">
          <h3 className="card-title">Users vs Signups (This Week)</h3>
          <div className="chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="3 3" />
                <XAxis dataKey="label" stroke="#ccc" />
                <YAxis stroke="#ccc" />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #333", color: "#fff" }} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  <Cell fill="#e50914" />
                  <Cell fill="#0ea5e9" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* User Roles pie chart removed */}
      </div>
    </div>
  );
}

export default AnalyticsPage;