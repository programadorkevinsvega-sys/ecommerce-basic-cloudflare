import { StorefrontStoreProfile } from './StorefrontStoreProfile.js';

export function renderStoreFooterDetails(profile?: StorefrontStoreProfile): string {
  if (!profile) return '';
  const email = profile.supportEmail.trim() === 'contacto@tienda.com' ? '' : profile.supportEmail.trim();
  const phone = profile.supportPhone?.trim() === '+57 300 0000000' ? '' : profile.supportPhone?.trim();
  const address = profile.companyAddress?.trim();
  const location = [profile.companyCity, profile.companyCountry].filter(Boolean).join(', ');
  return `<section class="footer-column footer-contact" aria-labelledby="footer-contact-title">
    <h2 id="footer-contact-title">Contacto</h2>
    ${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : ''}
    ${phone ? `<a href="tel:${escapeHtml(phone.replace(/[^+\d]/g, ''))}">${escapeHtml(phone)}</a>` : ''}
    ${address || location ? `<address>${address ? `${escapeHtml(address)}<br>` : ''}${escapeHtml(location)}</address>` : ''}
  </section>`;
}

export function renderStoreLegalIdentity(profile?: StorefrontStoreProfile): string {
  if (!profile) return '';
  const legalName = profile.companyLegalName?.trim();
  const nit = profile.companyNit?.trim();
  if (!legalName && !nit) return '';
  return `<div class="footer-legal-identity">${legalName ? `<span>${escapeHtml(legalName)}</span>` : ''}${nit ? `<span>NIT: ${escapeHtml(nit)}</span>` : ''}</div>`;
}

export function renderStoreSocialLinks(profile?: StorefrontStoreProfile): string {
  if (!profile) return '';
  const links = [
    socialLink('Instagram', profile.socialInstagramUrl, 'instagram.com', '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="18" cy="6" r=".8" fill="currentColor" stroke="none"/>'),
    socialLink('TikTok', profile.socialTiktokUrl, 'tiktok.com', '<path d="M14 3v11.2a4.2 4.2 0 1 1-4-4.2"/><path d="M14 3c.5 3 2.5 4.8 5.5 5"/>'),
    socialLink('Facebook', profile.socialFacebookUrl, 'facebook.com', '<path d="M14 8h3V4h-3a5 5 0 0 0-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9a1 1 0 0 1 1-1Z" fill="currentColor" stroke="none"/>'),
  ].filter(Boolean).join('');
  return links ? `<nav class="footer-social-links" aria-label="Redes sociales de ${escapeHtml(profile.storeName)}">${links}</nav>` : '';
}

export function renderCheckoutStoreDetails(profile?: StorefrontStoreProfile): string {
  if (!profile) return '';
  const location = [profile.companyCity, profile.companyCountry].filter(Boolean).join(', ');
  const address = [profile.companyAddress, location].filter(Boolean).join(' · ');
  const email = profile.supportEmail.trim() === 'contacto@tienda.com' ? '' : profile.supportEmail.trim();
  return `<span class="checkout-footer-store-details">
    ${email ? `<a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a>` : ''}
    ${profile.companyLegalName ? `<span>${escapeHtml(profile.companyLegalName)}</span>` : ''}
    ${profile.companyNit ? `<span>NIT: ${escapeHtml(profile.companyNit)}</span>` : ''}
    ${address ? `<span>${escapeHtml(address)}</span>` : ''}
  </span>`;
}

function socialLink(label: string, value: string | undefined, domain: string, icon: string): string {
  const href = safeSocialUrl(value, domain);
  if (!href) return '';
  return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" aria-label="${label} de la tienda, abre en una pestaña nueva"><svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${icon}</svg></a>`;
}

function safeSocialUrl(value: string | undefined, domain: string): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || (url.hostname !== domain && !url.hostname.endsWith(`.${domain}`)) || url.username || url.password || url.port) return undefined;
    return url.toString();
  } catch { return undefined; }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' })[char] ?? char);
}
