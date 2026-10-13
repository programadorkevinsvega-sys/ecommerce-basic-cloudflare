-- 0002 creó `read` con DEFAULT 0. Copiamos el estado original antes de
-- depender de la columna expandida, preservando notificaciones ya leídas.
UPDATE realtime_notifications
SET read = is_read;
