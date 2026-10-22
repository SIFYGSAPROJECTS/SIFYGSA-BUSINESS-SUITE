// ============================================================
// SFG Business Suite — Backend API (Next.js)
// Esta aplicación solo expone APIs REST, no tiene UI frontend.
// ============================================================
export default function Home() {
  return (
    <main style={{ fontFamily: "system-ui", padding: "2rem", maxWidth: "800px", margin: "0 auto" }}>
      <h1>🚀 SFG Business Suite — API Backend</h1>
      <p>
        Este servidor expone las APIs REST para la plataforma SFG Business Suite.
        No hay interfaz visual aquí — el frontend se sirve desde Vite en otro puerto.
      </p>
      <h2>📡 Endpoints disponibles</h2>
      <ul>
        <li><code>GET /api/health</code> — Health check</li>
        <li><strong>Auth</strong>
          <ul>
            <li><code>POST /api/v1/auth/login</code></li>
            <li><code>GET  /api/v1/auth/me</code></li>
            <li><code>POST /api/v1/auth/logout</code></li>
          </ul>
        </li>
        <li><strong>CRM</strong>
          <ul>
            <li><code>GET  /api/v1/crm/metrics</code></li>
            <li><code>GET|POST /api/v1/crm/opportunities</code></li>
            <li><code>GET|PUT|DELETE /api/v1/crm/opportunities/:id</code></li>
            <li><code>GET|POST /api/v1/crm/clients</code></li>
            <li><code>GET|PUT|DELETE /api/v1/crm/clients/:id</code></li>
            <li><code>GET|POST /api/v1/crm/activities</code></li>
          </ul>
        </li>
        <li><strong>Recursos Humanos</strong>
          <ul>
            <li><code>GET  /api/v1/rh/metrics</code></li>
            <li><code>GET|POST /api/v1/rh/employees</code></li>
            <li><code>GET|PUT|DELETE /api/v1/rh/employees/:id</code></li>
            <li><code>GET|POST /api/v1/rh/attendance</code></li>
            <li><code>GET|POST /api/v1/rh/leaves</code></li>
            <li><code>GET|PATCH|DELETE /api/v1/rh/leaves/:id</code></li>
            <li><code>GET|POST /api/v1/rh/payroll</code></li>
          </ul>
        </li>
        <li><strong>Compras</strong>
          <ul>
            <li><code>GET|POST /api/v1/compras/requisitions</code></li>
            <li><code>GET|PUT|PATCH|DELETE /api/v1/compras/requisitions/:id</code></li>
            <li><code>GET|POST /api/v1/compras/suppliers</code></li>
            <li><code>GET|PUT|DELETE /api/v1/compras/suppliers/:id</code></li>
            <li><code>GET|POST /api/v1/compras/purchase-orders</code></li>
          </ul>
        </li>
        <li><strong>Dashboard</strong>
          <ul>
            <li><code>GET /api/v1/dashboard/summary</code></li>
            <li><code>GET /api/v1/dashboard/charts</code></li>
          </ul>
        </li>
        <li><strong>Settings</strong>
          <ul>
            <li><code>GET|PUT /api/v1/settings</code></li>
            <li><code>GET|POST /api/v1/settings/users</code></li>
          </ul>
        </li>
      </ul>
    </main>
  );
}
