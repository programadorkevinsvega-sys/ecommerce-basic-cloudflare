export function renderAuthPage(redirectTo = '/', siteKey?: string): string {
  return `
    <div style="max-width: 450px; margin: 2rem auto; background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 2rem;">
      <h1 style="font-size: 1.75rem; font-weight: 700; margin-bottom: 0.5rem; text-align: center;">Iniciar Sesión</h1>
      <p style="color: var(--muted); text-align: center; margin-bottom: 1.5rem;">Accede a tu cuenta para gestionar tus pedidos y compras.</p>
      
      <form id="loginForm" style="display: flex; flex-direction: column; gap: 1rem;">
        <input type="hidden" id="redirectTo" value="${escapeHtml(redirectTo)}">
        <div>
          <label style="display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem;">Correo Electrónico</label>
          <input type="email" id="email" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px;" />
        </div>
        ${siteKey ? `<div class="cf-turnstile" data-sitekey="${escapeHtml(siteKey)}" data-theme="light"></div>` : '<div id="turnstileNotice" style="color:#a12727;text-align:center">La verificación de seguridad no está configurada.</div>'}
        <div>
          <label style="display: block; font-weight: 600; font-size: 0.9rem; margin-bottom: 0.25rem;">Contraseña</label>
          <input type="password" id="password" required style="width: 100%; padding: 0.75rem; border: 1px solid var(--border); border-radius: 6px;" />
        </div>
        <button type="submit" style="padding: 0.75rem; background: var(--primary); color: #fff; border: none; border-radius: 6px; font-weight: 700; cursor: pointer; margin-top: 0.5rem;">
          Ingresar
        </button>
        <div id="loginError" style="color: #dc2626; font-size: 0.9rem; text-align: center; display: none;"></div>
      </form>

      <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border); text-align: center; font-size: 0.9rem;">
        ¿Aún no tienes cuenta? <a href="/auth/register" style="color: var(--accent); font-weight: 600; text-decoration: none;">Regístrate aquí</a>
      </div>
    </div>

    <script>
      document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const errDiv = document.getElementById('loginError');
        const turnstileToken = document.querySelector('[name="cf-turnstile-response"]')?.value;
        if (!turnstileToken) { errDiv.textContent = 'Completa la verificación de seguridad.'; errDiv.style.display = 'block'; return; }

        try {
          const res = await fetch('/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, turnstileToken })
          });
          if (res.ok) {
            window.location.href = document.getElementById('redirectTo').value || '/';
          } else {
            const data = await res.json();
            errDiv.textContent = data.error || 'Credenciales inválidas';
            errDiv.style.display = 'block';
            if (window.turnstile) window.turnstile.reset();
          }
        } catch {
          errDiv.textContent = 'Error de conexión';
          errDiv.style.display = 'block';
        }
      });
    </script>
    ${siteKey ? '<script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>' : ''}
  `;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char] || char));
}
