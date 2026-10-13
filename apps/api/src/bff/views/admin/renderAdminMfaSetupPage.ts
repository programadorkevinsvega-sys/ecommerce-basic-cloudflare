export function renderAdminMfaSetupPage(): string {
  return `<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Activar MFA | Vega Store</title>
    <style>
      body{font:16px system-ui;background:#0f172a;color:#f8fafc;max-width:42rem;margin:4rem auto;padding:1rem}
      main{background:#1e293b;padding:2rem;border-radius:.75rem}
      label{display:block;margin:.8rem 0 .3rem}
      input,button,textarea{box-sizing:border-box;width:100%;padding:.7rem;font:inherit}
      textarea{min-height:6rem}button{margin-top:1rem;cursor:pointer}.status{min-height:1.5rem}
      figure{margin:1.5rem 0;text-align:center}#qr{width:min(100%,18rem);height:auto;background:#fff;padding:1rem;border-radius:.5rem}
      details{margin:1rem 0}summary{cursor:pointer}code{overflow-wrap:anywhere}
      :focus-visible{outline:3px solid #bef264;outline-offset:2px}
    </style>
  </head>
  <body>
    <main>
      <h1>Activa la verificación en dos pasos</h1>
      <p>La sesión solo permite completar esta configuración. Instala o abre una app TOTP, como Google Authenticator, 1Password o Bitwarden.</p>
      <p><strong>El código no se envía por correo.</strong> La app autenticadora mostrará un código de seis dígitos que cambia cada 30 segundos. No compartas el secreto ni ese código.</p>
      <form id="begin">
        <label for="password">Confirma tu contraseña</label>
        <input id="password" type="password" autocomplete="current-password" required>
        <button>Generar configuración TOTP</button>
      </form>
      <section id="activation" hidden>
        <h2>Escanea este código QR</h2>
        <p>Abre tu app autenticadora y escanéalo desde otro dispositivo o pantalla. El QR contiene tu secreto privado; no lo compartas.</p>
        <figure><img id="qr" alt="Código QR privado para configurar la app autenticadora" width="256" height="256"></figure>
        <details>
          <summary>¿No puedes escanearlo? Ver configuración manual</summary>
          <p>En la app, añade una cuenta y copia el secreto. Al generar una configuración nueva, la anterior deja de funcionar.</p>
          <label for="secret">Secreto manual (privado)</label>
          <textarea id="secret" readonly></textarea>
          <label for="uri">URI para copiar en la app</label>
          <textarea id="uri" readonly></textarea>
        </details>
        <form id="confirm">
          <label for="code">Código actual de 6 dígitos de tu app</label>
          <input id="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required>
          <button>Confirmar y activar MFA</button>
        </form>
      </section>
      <p id="status" class="status" role="status" aria-live="polite"></p>
    </main>
    <script>
      const status = document.getElementById('status');
      async function postJson(path, payload) {
        const response = await fetch(path, {
          method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(data.error || 'No se pudo completar la solicitud.');
        return data;
      }
      document.getElementById('begin').addEventListener('submit', async (event) => {
        event.preventDefault(); status.textContent = 'Validando…';
        try {
          const data = await postJson('/api/v1/admin/auth/mfa/enrollment', {
            password: document.getElementById('password').value,
          });
          document.getElementById('secret').value = data.secret;
          document.getElementById('uri').value = data.otpauthUri;
          document.getElementById('qr').src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(data.qrSvg);
          document.getElementById('activation').hidden = false;
          status.textContent = 'Escanea el QR con tu app y escribe aquí el código de seis dígitos.';
        } catch (error) { status.textContent = error instanceof Error ? error.message : 'Error de conexión.'; }
      });
      document.getElementById('confirm').addEventListener('submit', async (event) => {
        event.preventDefault(); status.textContent = 'Verificando código…';
        try {
          const data = await postJson('/api/v1/admin/auth/mfa/confirm', {
            code: document.getElementById('code').value,
          });
          status.textContent = 'MFA activado. Redirigiendo al panel…';
          location.href = data.redirect || '/admin';
        } catch (error) { status.textContent = error instanceof Error ? error.message : 'Error de conexión.'; }
      });
    </script>
  </body>
</html>`;
}
