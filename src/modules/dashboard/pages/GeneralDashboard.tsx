import React from 'react';
import '../dashboard.css';

interface GeneralDashboardProps {
  onNavigateModule: (moduleId: string, subItemId?: string) => void;
}

export const GeneralDashboard: React.FC<GeneralDashboardProps> = ({ onNavigateModule }) => {
  return (
    <div className="gemini-dashboard-container">
      {/* SECTION A: 6 KPI METRICS CARDS */}
      <section className="kpi-metrics-grid">
        {/* KPI 1: KPIS */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateModule('crm', 'crm-opportunities')}
          title="Ver Cartera de Oportunidades CRM"
        >
          <div className="kpi-card-header">
            <span className="kpi-label">KPIS</span>
            <div className="kpi-icon-container orange">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">$120,400</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$120,400 MRR</span>
              <span className="trend-badge positive">+16% ↑</span>
            </div>
          </div>
        </div>

        {/* KPI 2: Total Users */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Total Users</span>
            <div className="kpi-icon-container cyan">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">239</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$12,491 Users</span>
              <span className="trend-badge positive">+16% ↑</span>
            </div>
          </div>
        </div>

        {/* KPI 3: New MRR */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">New MRR</span>
            <div className="kpi-icon-container amber">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">134</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$1.00 MRR</span>
              <span className="trend-badge negative">-3%</span>
            </div>
          </div>
        </div>

        {/* KPI 4: Total */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Total</span>
            <div className="kpi-icon-container emerald">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.516 0c.85.493 1.508 1.333 1.508 2.316V18" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">323</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$22.72 Change</span>
              <span className="trend-badge negative">-3%</span>
            </div>
          </div>
        </div>

        {/* KPI 5: Active Projects */}
        <div
          className="kpi-card"
          style={{ cursor: 'pointer' }}
          onClick={() => onNavigateModule('crm', 'crm-kanban')}
          title="Ver Tablero de Actividades / Kanban"
        >
          <div className="kpi-card-header">
            <span className="kpi-label">Active Projects</span>
            <div className="kpi-icon-container blue">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">40</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">33% Average</span>
              <span className="trend-badge neutral">^ 0%</span>
            </div>
          </div>
        </div>

        {/* KPI 6: Team Projects */}
        <div className="kpi-card">
          <div className="kpi-card-header">
            <span className="kpi-label">Team Projects</span>
            <div className="kpi-icon-container purple">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" style={{ width: 14, height: 14 }}>
                <path d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <div className="kpi-card-body">
            <h3 className="kpi-metric-number">41</h3>
            <div className="kpi-footer-row">
              <span className="kpi-sub">$119,000 MRR</span>
              <span className="trend-badge negative">-6%</span>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION B: MIDDLE ROW CHARTS & OPERATIONAL TASKS */}
      <section className="middle-charts-grid">
        {/* Monthly Revenue Trend */}
        <div className="dashboard-portlet-card span-5">
          <div className="portlet-card-header">
            <h3 className="portlet-title-text">Monthly Revenue Trend</h3>
            <span className="portlet-tag-mono">2024 (USD)</span>
          </div>

          <div className="bar-chart-container">
            {/* Y Axis */}
            <div className="chart-y-axis">
              <span>2500</span>
              <span>2000</span>
              <span>1500</span>
              <span>1000</span>
              <span>500</span>
              <span>0</span>
            </div>

            {/* Bars Area */}
            <div className="chart-bars-wrap">
              <div className="chart-grid-backdrop">
                <div className="grid-h-line" />
                <div className="grid-h-line" />
                <div className="grid-h-line" />
                <div className="grid-h-line" />
                <div className="grid-h-line" />
              </div>

              <div className="chart-bars-row">
                <div className="month-bars-group" title="Jul">
                  <div className="bar-item gray" style={{ height: '36%' }} />
                  <div className="bar-item orange" style={{ height: '54%' }} />
                </div>
                <div className="month-bars-group" title="Aug">
                  <div className="bar-item gray" style={{ height: '28%' }} />
                  <div className="bar-item cyan" style={{ height: '62%' }} />
                </div>
                <div className="month-bars-group" title="Sep">
                  <div className="bar-item gray" style={{ height: '70%' }} />
                  <div className="bar-item orange" style={{ height: '80%' }} />
                </div>
                <div className="month-bars-group" title="Oct">
                  <div className="bar-item gray" style={{ height: '52%' }} />
                  <div className="bar-item amber" style={{ height: '68%' }} />
                </div>
                <div className="month-bars-group" title="Nov">
                  <div className="bar-item gray" style={{ height: '85%' }} />
                  <div className="bar-item orange" style={{ height: '94%' }} />
                </div>
                <div className="month-bars-group" title="Dec">
                  <div className="bar-item gray" style={{ height: '60%' }} />
                  <div className="bar-item cyan" style={{ height: '98%' }} />
                </div>
              </div>

              {/* X Axis */}
              <div className="chart-x-axis">
                <span>Jul</span>
                <span>Aug</span>
                <span>Sep</span>
                <span>Oct</span>
                <span>Nov</span>
                <span>Dec</span>
              </div>
            </div>
          </div>
        </div>

        {/* Completion 73% Donut */}
        <div className="dashboard-portlet-card span-3 align-center">
          <div className="portlet-card-header full-w">
            <span className="portlet-title-text">Completion</span>
            <span className="portlet-tag-mono">ACTIVE</span>
          </div>

          <div className="donut-gauge-wrapper">
            <svg className="donut-svg" viewBox="0 0 36 36">
              <path
                className="donut-bg-track"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="donut-progress-fill"
                strokeDasharray="73, 100"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="donut-center-label">
              <span className="donut-percent-num">73%</span>
              <span className="donut-sub-text">Efficiency</span>
            </div>
          </div>

          <div className="donut-legend-bar">
            <span className="legend-entry">
              <span className="legend-dot orange" />
              <span>Donuts</span>
            </span>
            <span className="legend-entry">
              <span className="legend-dot gray" />
              <span>Donut Thart</span>
            </span>
            <span className="legend-entry">
              <span className="legend-dot cyan" />
              <span>Legend</span>
            </span>
          </div>
        </div>

        {/* Operational Tasks */}
        <div className="dashboard-portlet-card span-4">
          <div className="portlet-card-header">
            <h3 className="portlet-title-text">Operational Tasks</h3>
            <span className="active-tasks-pill">5 Active</span>
          </div>

          <div className="operational-tasks-table-wrap">
            <table className="operational-table">
              <thead>
                <tr>
                  <th>Tasks</th>
                  <th style={{ textAlign: 'center' }}>Progress %</th>
                  <th style={{ textAlign: 'center' }}>Due Date</th>
                  <th style={{ textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="task-title-cell" title="Task of valorikion">Task of valorikion</td>
                  <td className="center-cell green-text">100%</td>
                  <td className="center-cell mono-date">00/08/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle green">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="task-title-cell" title="Commoncorpoeition">Commoncorpoeition</td>
                  <td className="center-cell green-text">100%</td>
                  <td className="center-cell mono-date">00/08/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle green">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="task-title-cell" title="Scen traded test">Scen traded test</td>
                  <td className="center-cell amber-text">35%</td>
                  <td className="center-cell mono-date">00/09/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle gray">✕</span>
                  </td>
                </tr>
                <tr>
                  <td className="task-title-cell" title="Task tolement">Task tolement</td>
                  <td className="center-cell cyan-text">35%</td>
                  <td className="center-cell mono-date">00/04/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle green">✓</span>
                  </td>
                </tr>
                <tr>
                  <td className="task-title-cell" title="Task te option">Task te option</td>
                  <td className="center-cell rose-text">15%</td>
                  <td className="center-cell mono-date">00/04/00</td>
                  <td className="status-cell-right">
                    <span className="status-check-circle red">✕</span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* SECTION C: BOTTOM ROW KANBAN, CATEGORY SPLIT & PODIUM */}
      <section className="bottom-charts-grid">
        {/* Status Board (Sprint Current) */}
        <div className="dashboard-portlet-card span-5" onClick={() => onNavigateModule('crm', 'crm-kanban')} style={{ cursor: 'pointer' }} title="Clic para ir al módulo completo de CRM & Kanban">
          <div className="portlet-card-header">
            <h3 className="portlet-title-text">Status Board</h3>
            <span className="portlet-tag-mono">Sprint Current</span>
          </div>

          <div className="status-board-columns">
            {/* TO DO */}
            <div className="mini-column">
              <span className="mini-col-title">TO DO</span>
              <div className="mini-task-card">
                <p className="mini-task-name">Devehris a place task</p>
                <span className="mini-task-tag orange">Task #1</span>
              </div>
              <div className="mini-task-card">
                <p className="mini-task-name">Deonnitso ftad dating each task</p>
                <span className="mini-task-tag gray">Task #2</span>
              </div>
            </div>

            {/* IN PROGRESS */}
            <div className="mini-column">
              <span className="mini-col-title cyan">IN PROGRESS</span>
              <div className="mini-task-card">
                <p className="mini-task-name">Task for ncaeting for process</p>
                <span className="mini-task-tag cyan">Task #2</span>
              </div>
              <div className="mini-task-card">
                <p className="mini-task-name">Task qusttto task</p>
                <span className="mini-task-tag gray">Task #3</span>
              </div>
            </div>

            {/* REVIEW */}
            <div className="mini-column">
              <span className="mini-col-title amber">REVIEW</span>
              <div className="mini-task-card">
                <p className="mini-task-name">Decourarise a Review</p>
                <span className="mini-task-tag amber">Task #3</span>
              </div>
              <div className="mini-task-card">
                <p className="mini-task-name">Stomplete brarest</p>
                <span className="mini-task-tag gray">Task 64</span>
              </div>
            </div>

            {/* DONE */}
            <div className="mini-column">
              <span className="mini-col-title green">DONE</span>
              <div className="mini-task-card">
                <p className="mini-task-name">Monthly Revenue shrtewn</p>
                <span className="mini-task-tag green">Task #0</span>
              </div>
              <div className="mini-task-card">
                <p className="mini-task-name">Commitss ftad dating each task</p>
                <span className="mini-task-tag green">Task #5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Split */}
        <div className="dashboard-portlet-card span-3 align-center">
          <div className="portlet-card-header full-w">
            <h3 className="portlet-title-text">Category Split</h3>
            <span className="portlet-tag-mono">Segmented</span>
          </div>

          <div className="donut-gauge-wrapper">
            <svg className="pie-multi-svg" viewBox="0 0 100 100">
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="#F97316" strokeDasharray="39 118" strokeDashoffset="0" strokeWidth="24" />
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="#06B6D4" strokeDasharray="31 126" strokeDashoffset="-39" strokeWidth="24" />
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="#4B5563" strokeDasharray="28 129" strokeDashoffset="-70" strokeWidth="24" />
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="#9CA3AF" strokeDasharray="35 122" strokeDashoffset="-98" strokeWidth="24" />
              <circle cx="50" cy="50" fill="transparent" r="25" stroke="#F59E0B" strokeDasharray="24 133" strokeDashoffset="-133" strokeWidth="24" />
            </svg>
            <div className="pie-center-hole">
              <span className="pie-percent-text">100%</span>
            </div>
          </div>

          <div className="donut-legend-bar">
            <span className="legend-entry">
              <span className="legend-dot orange" />
              <span>F&amp;G</span>
            </span>
            <span className="legend-entry">
              <span className="legend-dot cyan" />
              <span>Safety</span>
            </span>
            <span className="legend-entry">
              <span className="legend-dot gray" />
              <span>Audits</span>
            </span>
          </div>
        </div>

        {/* Team Leaders (Podium) */}
        <div className="dashboard-portlet-card span-4">
          <div className="portlet-card-header">
            <h3 className="portlet-title-text">Team Leaders</h3>
            <span className="top-performer-pill">Top 3 Performer</span>
          </div>

          <div className="team-podium-stack">
            {/* Rank 2: User 2 */}
            <div className="podium-pillar-col">
              <div className="podium-avatar-circle u2">U2</div>
              <div className="podium-block step-2">
                <span className="rank-num">2</span>
                <span className="user-podium-name">User 2</span>
              </div>
            </div>

            {/* Rank 1: Jared S. */}
            <div className="podium-pillar-col highest">
              <div className="podium-crown-badge">👑</div>
              <div className="podium-avatar-circle js-leader">JS</div>
              <div className="podium-block step-1">
                <span className="rank-num orange">1</span>
                <span className="user-podium-name white">Jared S.</span>
                <span className="podium-kpi-val">98% KPI</span>
              </div>
            </div>

            {/* Rank 3: User 3 */}
            <div className="podium-pillar-col">
              <div className="podium-avatar-circle u3">U3</div>
              <div className="podium-block step-3">
                <span className="rank-num">3</span>
                <span className="user-podium-name">User 3</span>
              </div>
            </div>
          </div>

          <div className="podium-footer-note">
            <span>Leaderboard updated 5 mins ago</span>
          </div>
        </div>
      </section>
    </div>
  );
};

export default GeneralDashboard;
