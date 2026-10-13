export function renderAdminLoginPage(): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Acceso Administrativo | Vega Store</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    body { background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 1rem; }
    .card { background: #1e293b; border: 1px solid #334155; border-radius: 8px; width: 100%; max-width: 400px; padding: 2rem; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
    h1 { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; text-align: center; color: #fff; }
    p { font-size: 0.875rem; color: #94a3b8; text-align: center; margin-bottom: 1.5rem; }
    .form-group { margin-bottom: 1.25rem; }
    label { display: block; font-size: 0.875rem; font-weight: 600; margin-bottom: 0.35rem; color: #cbd5e1; }
    input { width: 100%; padding: 0.75rem; background: #0f172a; border: 1px solid #334155; border-radius: 6px; color: #fff; font-size: 0.95rem; }
    input:focus { outline: none; border-color: #3b82f6; }
    button { width: 100%; padding: 0.75rem; background: #2563eb; color: #fff; border: none; border-radius: 6px; font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.15s; }
    button:hover { background: #1d4ed8; }
    .error { background: #7f1d1d; color: #fecaca; padding: 0.75rem; border-radius: 6px; font-size: 0.875rem; margin-top: 1rem; display: none; text-align: center; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Panel de Administración</h1>
    <p>Ingresa tus credenciales de superadmin o editor</p>
    <form id="adminLoginForm">
      <div class="form-group">
        <label for="email">Correo Institucional</label>
        <input type="email" id="email" required placeholder="admin@vega.com" />
      </div>
      <div class="form-group">
        <label for="password">Contraseña</label>
        <input type="password" id="password" required placeholder="••••••••" />
      </div>
      <div class="form-group">
        <label for="totpCode">Código de autenticación (si ya activaste MFA)</label>
        <input type="text" id="totpCode" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" />
      </div>
      <button type="submit">Iniciar Sesión</button>
      <div id="errorBox" class="error"></div>
    </form>
  </div>
  <script>
    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const totpCode = document.getElementById('totpCode').value;
      const errBox = document.getElementById('errorBox');
      errBox.style.display = 'none';

      try {
        const res = await fetch('/api/v1/admin/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, ...(totpCode ? { totpCode } : {}) })
        });
        const data = await res.json();
        if (res.ok) {
          window.location.href = data.mfaEnabled ? '/admin' : '/admin/mfa-setup';
        } else {
          errBox.textContent = data.error || 'Credenciales inválidas';
          errBox.style.display = 'block';
        }
      } catch {
        errBox.textContent = 'Error de conexión con el servidor';
        errBox.style.display = 'block';
      }
    });
  </script>
</body>
</html>`;
}
