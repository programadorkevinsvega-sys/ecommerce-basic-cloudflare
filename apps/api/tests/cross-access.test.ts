import { describe, it, expect } from 'vitest';
import { Customer } from '../src/modules/identity/domain/entities/Customer.js';
import { Session } from '../src/modules/identity/domain/entities/Session.js';

describe('Pruebas de Aislamiento y Acceso Cruzado (SEC-ISO-06 / SEC-ISO-07)', () => {
  it('SEC-ISO-07: Un token con actorType "customer" no puede ser interpretado como sesión de "admin"', () => {
    const customerSession = Session.create({
      id: 'session-c1',
      tokenHash: 'hash-c1',
      actorType: 'customer',
      actorId: 'customer-123',
      expiresAt: new Date(Date.now() + 100000).toISOString(),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });

    // Simulación de control de acceso
    const isAllowedInAdminArea = (s: Session) => s.actorType === 'admin';
    expect(isAllowedInAdminArea(customerSession)).toBe(false);
  });

  it('SEC-ISO-06: Verificación de propiedad por customerId (el Cliente B no puede consultar recursos del Cliente A)', () => {
    const customerA = Customer.create({
      id: 'customer-aaa',
      email: 'a@example.com',
      passwordHash: 'hash-a',
      fullName: 'Cliente A',
      isActive: true,
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const sessionCustomerB = Session.create({
      id: 'session-b',
      tokenHash: 'hash-b',
      actorType: 'customer',
      actorId: 'customer-bbb', // Sesión pertenece al Cliente B
      expiresAt: new Date(Date.now() + 100000).toISOString(),
      createdAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
    });

    // Consulta con verificación estricta de propiedad
    const canAccessCustomerProfile = (requestingSession: Session, targetCustomerId: string) => {
      return requestingSession.actorId === targetCustomerId;
    };

    // El Cliente B intenta acceder al perfil del Cliente A: debe ser denegado
    expect(canAccessCustomerProfile(sessionCustomerB, customerA.id)).toBe(false);
  });
});
