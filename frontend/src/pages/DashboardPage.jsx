import { useState, useEffect } from 'react';
import API from '../services/api';
import { Link } from 'react-router-dom';
import PVIGauge from '../components/dashboard/PVIGauge';
import { Chart as ChartJS, ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';

ChartJS.register(ArcElement, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const DashboardPage = () => {
    const [data, setData] = useState(null);
    const [charts, setCharts] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [summaryRes, chartsRes] = await Promise.all([
                    API.get('/analytics/summary'),
                    API.get('/analytics/charts')
                ]);
                setData(summaryRes.data);
                setCharts(chartsRes.data);
            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="page-container">Loading Dashboard...</div>;

    // Chart Data Preparation
    const activityData = {
        labels: Object.keys(charts?.activityBreakdown || {}),
        datasets: [{
            data: Object.values(charts?.activityBreakdown || {}),
            backgroundColor: [
                '#6366f1', '#ec4899', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'
            ],
            borderWidth: 0
        }]
    };

    const trendLabels = charts?.trend?.map(t => t.date) || [];
    const trendValues = charts?.trend?.map(t => t.minutes) || []; // Using minutes as trend for now

    const trendData = {
        labels: trendLabels,
        datasets: [{
            label: 'Minutes Wasted',
            data: trendValues,
            backgroundColor: '#6366f1',
        }]
    };

    return (
        <div className="page-container animate-fade-in">
            {/* Top Row: PVI & Root Cause */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>

                <div className="card">
                    <PVIGauge value={data?.pvi || 0} />
                    <div style={{ textAlign: 'center', marginTop: '-2rem' }}>
                        <p style={{ color: 'var(--color-text-muted)' }}>7-Day Score</p>
                    </div>
                </div>

                <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <h3 style={{ color: 'var(--color-text-muted)', marginBottom: '0.5rem' }}>Likely Root Cause</h3>
                    <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-text-main)', marginBottom: '0.5rem' }}>
                        {data?.rootCauseLabel?.replace(/_/g, ' ') || 'Calculating...'}
                    </div>
                    <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
                        {data?.rootCauseLabel === 'OVERWHELM_AVOIDANCE' ? "Task difficulty is triggering anxiety avoidance." :
                            data?.rootCauseLabel === 'DOOMSCROLL_LOOP' ? "You're trapped in passive consumption cycles." :
                                "Keep logging to detect patterns."}
                    </p>

                    {data?.rootCauseLabel && (
                        <Link to={`/modes/${data.rootCauseLabel}`} className="btn btn-primary" style={{ textAlign: 'center', textDecoration: 'none' }}>
                            Activate Countermeasure Mode
                        </Link>
                    )}
                </div>
            </div>

            {/* Stats Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data?.stats?.totalMinutes || 0}</div>
                    <div className="text-muted">Total Minutes Lost</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{data?.stats?.avgSessionMinutes || 0}</div>
                    <div className="text-muted">Avg. Session (min)</div>
                </div>
                <div className="card" style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '2rem', fontWeight: 'bold', textTransform: 'capitalize' }}>{data?.stats?.topActivity || '-'}</div>
                    <div className="text-muted">Top Distraction</div>
                </div>
            </div>

            {/* Charts Row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem' }}>
                <div className="card">
                    <h3>Activity Breakdown</h3>
                    <div style={{ height: '300px', display: 'flex', justifyContent: 'center' }}>
                        <Doughnut data={activityData} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} />
                    </div>
                </div>
                <div className="card">
                    <h3>Avoidance Trend (Minutes)</h3>
                    <div style={{ height: '300px' }}>
                        <Bar data={trendData} options={{ maintainAspectRatio: false }} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;
