-- ============================================================
--  UPDATE couple_info TABLE
--  Replace first name only with full name fields
-- ============================================================

-- Drop old table and recreate with full name fields
DROP TABLE IF EXISTS couple_info;

CREATE TABLE couple_info (
    id                  SERIAL PRIMARY KEY,
    groom_first_name    VARCHAR(100) NOT NULL,
    groom_middle_name   VARCHAR(100),
    groom_last_name     VARCHAR(100) NOT NULL,
    bride_first_name    VARCHAR(100) NOT NULL,
    bride_middle_name   VARCHAR(100),
    bride_last_name     VARCHAR(100) NOT NULL,
    tagline             TEXT,
    subtitle            TEXT,
    image_primary       VARCHAR(255),
    image_secondary     VARCHAR(255),
    music_path          VARCHAR(255),
    invitation_title    TEXT,
    invitation_body     TEXT
);

INSERT INTO couple_info (
    groom_first_name, groom_middle_name, groom_last_name,
    bride_first_name, bride_middle_name, bride_last_name,
    tagline, subtitle,
    image_primary, image_secondary, music_path,
    invitation_title, invitation_body
) VALUES (
    'Nielle',   '',   'Ferrer',
    'Camille',  '',   'Bacarrisas',
    'Finally, together under the trees.',
    'We Survived The Distance',
    '/image/wed.jpg',
    '/image/proposal.jpg',
    '/music/theme.mp3',
    'A Garden Ceremony Celebrating Union',
    'After seasons apart, we request the honor of your presence as we pledge our vows under the open sky of Tagaytay. Your love has been our compass through every distance.'
);