import { CustomerProfile } from '../../gateways/identity/IdentityGateway.js';
import { renderAccountSettingsShell } from './renderAccountSettingsShell.js';

export function renderCustomerProfilePage(profile: CustomerProfile): string {
  return renderAccountSettingsShell('Perfil', profile.email, `<div class="account-panel"><h2>Datos personales</h2><p class="form-note">Confirma tu contraseña para guardar cambios. El correo de la cuenta no se modifica desde aquí.</p><form id="profile-form" class="account-form">
<label>Nombre completo<input name="fullName" required minlength="2" maxlength="100" autocomplete="name" value="${escapeHtml(profile.fullName)}"></label>
<label>Teléfono o WhatsApp<input name="phone" maxlength="20" autocomplete="tel" value="${escapeHtml(profile.phone || '')}"></label>
<label>Correo electrónico<input value="${escapeHtml(profile.email)}" disabled><span class="form-note">Para cambiar el correo se requiere confirmar la nueva dirección.</span></label>
<label>Contraseña actual<input name="currentPassword" type="password" required maxlength="128" autocomplete="current-password"></label>
<button type="submit">Guardar perfil</button><p class="form-status" id="profile-status" role="status"></p></form></div>
<script>(()=>{const f=document.getElementById('profile-form'),s=document.getElementById('profile-status');f.addEventListener('submit',async e=>{e.preventDefault();s.textContent='Guardando…';const d=new FormData(f);try{const r=await fetch('/api/v1/customer/profile',{method:'PATCH',headers:{'content-type':'application/json'},body:JSON.stringify({fullName:d.get('fullName'),phone:d.get('phone'),currentPassword:d.get('currentPassword')})});const j=await r.json();s.textContent=r.ok?'Perfil actualizado.':(j.error||'No fue posible guardar.');if(r.ok)f.elements.currentPassword.value='';}catch{s.textContent='No fue posible conectar con la tienda.';}});})();</script>`);
}

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c] || c)); }
