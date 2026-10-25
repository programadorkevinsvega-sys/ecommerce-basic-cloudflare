ALTER TABLE settings_store ADD COLUMN factus_mode TEXT NOT NULL DEFAULT 'disabled';
ALTER TABLE settings_store ADD COLUMN factus_numbering_range_id TEXT;
ALTER TABLE settings_store ADD COLUMN factus_credit_note_numbering_range_id TEXT;
