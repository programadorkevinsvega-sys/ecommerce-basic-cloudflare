import { describe, expect, it } from 'vitest';
import { renderAdminMfaSetupPage } from '../src/bff/views/admin/renderAdminMfaSetupPage.js';

describe('admin MFA setup page', () => {
  it('renders a valid document and explains authenticator app delivery', () => {
    const html = renderAdminMfaSetupPage();
    expect(html).toContain('<title>Activar MFA | Vega Store</title>');
    expect(html).toContain('id="begin"');
    expect(html).toContain('id="confirm"');
    expect(html).toContain('id="qr"');
    expect(html).toContain('Escanea este código QR');
    expect(html).toContain('¿No puedes escanearlo? Ver configuración manual');
    expect(html).toContain('El código no se envía por correo');
    expect(html).toContain('postJson');
  });
});
