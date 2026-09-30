CREATE TABLE photos (
    id UUID PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    taken_on DATE,
    tags TEXT[] NOT NULL DEFAULT '{}',
    object_key TEXT NOT NULL UNIQUE,
    content_type VARCHAR(50) NOT NULL,
    byte_size BIGINT NOT NULL CHECK (byte_size > 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX photos_taken_on_idx ON photos (taken_on DESC, created_at DESC);
