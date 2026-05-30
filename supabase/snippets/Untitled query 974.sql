-- ============================================================
--  WEDDING DATABASE SCHEMA + SEED DATA
--  Based on weddingData.js
-- ============================================================

-- ============================================================
--  1. COUPLE INFO
-- ============================================================
CREATE TABLE couple_info (
    id               SERIAL PRIMARY KEY,
    groom_first      VARCHAR(100) NOT NULL,
    bride_first      VARCHAR(100) NOT NULL,
    tagline          TEXT,
    subtitle         TEXT,
    image_primary    VARCHAR(255),
    image_secondary  VARCHAR(255),
    music_path       VARCHAR(255),
    invitation_title TEXT,
    invitation_body  TEXT
);

INSERT INTO couple_info (
    groom_first, bride_first, tagline, subtitle,
    image_primary, image_secondary, music_path,
    invitation_title, invitation_body
) VALUES (
    'Nielle',
    'Camille',
    'Finally, together under the trees.',
    'We Survived The Distance',
    '/image/wed.jpg',
    '/image/proposal.jpg',
    '/music/theme.mp3',
    'A Garden Ceremony Celebrating Union',
    'After seasons apart, we request the honor of your presence as we pledge our vows under the open sky of Tagaytay. Your love has been our compass through every distance.'
);


-- ============================================================
--  2. EVENT DETAILS
-- ============================================================
CREATE TABLE event_details (
    id               SERIAL PRIMARY KEY,
    event_date       VARCHAR(100) NOT NULL,
    event_time       VARCHAR(150),
    program_start    VARCHAR(50),
    attire           VARCHAR(150),
    attire_note      TEXT,
    venue            VARCHAR(255),
    venue_address    TEXT,
    maps_url         TEXT,
    facebook_page    TEXT,
    map_embed        TEXT,
    global_maps_url  TEXT
);

INSERT INTO event_details (
    event_date, event_time, program_start,
    attire, attire_note,
    venue, venue_address,
    maps_url, facebook_page, map_embed, global_maps_url
) VALUES (
    'Tuesday, Dec 15, 2026',
    'Ceremony starts exactly at 4:00 PM',
    '3:30 PM',
    'Formal Minimalist Black',
    'Solid black suits, gowns, and cocktails.',
    'Vera Santuario Tagaytay',
    'Kabangaan Road Iruhin West, Tagaytay City 4120',
    'https://www.google.com/maps/dir/?api=1&destination=Vera+Santuario+Tagaytay&destination_place_id=ChIJeWTszKV7vTMRN3YUu5meYDA',
    'https://www.facebook.com/verasantuariotagaytay',
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3866.50567472097!2d120.8710344751069!3d14.281145186178052!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x33bd77c98030248f%3A0x676e273030c6a81e!2sVera+Santuario+Tagaytay!5e0!3m2!1sen!2sph!4v1716800000000!5m2!1sen!2sph',
    'https://www.google.com/maps/dir/?api=1&destination=Alfonso%2C+Cavite'
);


-- ============================================================
--  3. CONTACT INFO
-- ============================================================
CREATE TABLE contact_info (
    id             SERIAL PRIMARY KEY,
    phone          VARCHAR(20),
    facebook_name  VARCHAR(150),
    email          VARCHAR(255),
    rsvp_deadline  VARCHAR(100)
);

INSERT INTO contact_info (phone, facebook_name, email, rsvp_deadline)
VALUES (
    '09099272851',
    'Camilla Bacarrisas',
    'carmella.bacarrisas@gmail.com',
    'November 15, 2026'
);


-- ============================================================
--  4. LOVE STORY
-- ============================================================
CREATE TABLE love_story (
    id              SERIAL PRIMARY KEY,
    paragraph_order INT NOT NULL,
    content         TEXT NOT NULL
);

INSERT INTO love_story (paragraph_order, content) VALUES
(1, 'I (Camille) and Nielle met on July 4, 2017, right after we graduated. I''m from Cavite and he''s from Zambales, and we were both working students at Jollibee in our respective provinces. After graduation, we were promoted as manager trainees and became batchmates for training in Ortigas.'),
(2, 'Before the training, I reached out to one of the trainees from Zambales because I was nervous about not knowing anyone. She kindly let me stay with their group in their dorm. When I arrived, Danielle picked me up at the bus stop since I didn''t know the place yet—that was the first time we met.'),
(3, 'From there, we naturally got close. He helped me with my documents and made sure I was okay during the training. After we finished, we went on our first date at Megamall—and that''s where it all started.');


-- ============================================================
--  5. ENTOURAGE
-- ============================================================
CREATE TABLE entourage_groups (
    id           SERIAL PRIMARY KEY,
    title        VARCHAR(150) NOT NULL,
    display_order INT NOT NULL
);

CREATE TABLE entourage_members (
    id          SERIAL PRIMARY KEY,
    group_id    INT NOT NULL REFERENCES entourage_groups(id) ON DELETE CASCADE,
    full_name   VARCHAR(150) NOT NULL,
    member_order INT NOT NULL
);

INSERT INTO entourage_groups (title, display_order) VALUES
('Parents of the Groom',  1),
('Parents of the Bride',  2),
('Principal Sponsors',    3),
('Groomsmen',             4),
('Bridesmaids',           5),
('Flower Girl',           6),
('Ring Bearer',           7);

INSERT INTO entourage_members (group_id, full_name, member_order) VALUES
-- Parents of the Groom (group_id = 1)
(1, 'Richard Ferrer',           1),
(1, 'Erlina Belhida',           2),
-- Parents of the Bride (group_id = 2)
(2, 'Emeterio Bacarrisas',      1),
(2, 'Lina Bacarrisas',          2),
-- Principal Sponsors (group_id = 3)
(3, 'Rowena Shabazz',           1),
(3, 'Norman Cabiles',           2),
(3, 'Livelyn Castillo',         3),
(3, 'Alfred Castillo',          4),
-- Groomsmen (group_id = 4)
(4, 'John Carlo Ferrer',        1),
(4, 'Christoper Tangan',        2),
(4, 'Luigi Mayo',               3),
(4, 'Francis Estares',          4),
-- Bridesmaids (group_id = 5)
(5, 'Maybelyn Capacite',        1),
(5, 'Shaira Era',               2),
(5, 'Franchette Anne Palomo',   3),
(5, 'Fae Diane Vidad',          4),
-- Flower Girl (group_id = 6)
(6, 'Vela Eve Bacarrisas',      1),
-- Ring Bearer (group_id = 7)
(7, 'Matthias Dane Cleofe',     1);


-- ============================================================
--  6. SECONDARY SPONSORS
-- ============================================================
CREATE TABLE secondary_sponsors (
    id            SERIAL PRIMARY KEY,
    role          VARCHAR(100) NOT NULL,
    names         VARCHAR(255) NOT NULL,
    display_order INT NOT NULL
);

INSERT INTO secondary_sponsors (role, names, display_order) VALUES
('Veil',   'Christoper & Franchette', 1),
('Cord',   'Maybelyn & Francis',      2),
('Candle', 'Shaira & Luigi',          3);


-- ============================================================
--  7. SPECIAL ROLES
-- ============================================================
CREATE TABLE special_roles (
    id            SERIAL PRIMARY KEY,
    role          VARCHAR(150) NOT NULL,
    full_name     VARCHAR(150) NOT NULL,
    display_order INT NOT NULL
);

INSERT INTO special_roles (role, full_name, display_order) VALUES
('Best Man',            'Charles Erin Ferrer',    1),
('Matron of Honor',     'Cyrish Mae Bacarrisas',  2),
('Master of Ceremony',  'Theresa Tagum',          3);


-- ============================================================
--  8. FUNDAMENTALS / REMINDERS
-- ============================================================
CREATE TABLE fundamentals (
    id            SERIAL PRIMARY KEY,
    title         VARCHAR(150) NOT NULL,
    content       TEXT NOT NULL,
    display_order INT NOT NULL
);

INSERT INTO fundamentals (title, content, display_order) VALUES
('Attendance Request',
 'Since this is an intimate celebration, we''ve chosen to share this special day with only the most important people in our lives. Having you with us means so much as we celebrate this milestone.',
 1),
('RSVP Request',
 'As this is an intimate wedding, we are keeping our guest list limited to the people we have personally invited. We kindly ask for your understanding that we are unable to accommodate plus ones. Please confirm your attendance by November 15, 2026.',
 2),
('Dress Code',
 'We encourage guests to wear formal attire. Ladies may wear comfortable long dresses, and gentlemen may wear formal suits. Please note that Tagaytay is cold, so bringing a jacket is advised—just keep it within the color palette. Our motif is black with touches of white. We recommend black shoes, with minimal white accents allowed in accessories. This is a minimalist-themed wedding, so please keep your look simple and elegant.',
 3),
('Arrival Time',
 'We kindly ask guests to arrive 30 minutes before the program starts. Program will start promptly at 3:30 PM.',
 4),
('Unplugged Ceremony',
 'We kindly request an unplugged ceremony — please refrain from using phones during key moments.',
 5),
('Gifts',
 'We would love to receive anything from you, but please know that your presence is already enough gift for us. As we are still in a long-distance setup and do not have a home yet, we would truly appreciate monetary gifts instead. Kindly refrain from giving appliances.',
 6);


-- ============================================================
--  USEFUL QUERIES
-- ============================================================

-- Get all entourage groups with their members
SELECT
    g.title        AS group_name,
    m.full_name    AS member_name,
    m.member_order
FROM entourage_groups g
JOIN entourage_members m ON m.group_id = g.id
ORDER BY g.display_order, m.member_order;

-- Get love story in order
SELECT paragraph_order, content
FROM love_story
ORDER BY paragraph_order;

-- Get all fundamentals in order
SELECT title, content
FROM fundamentals
ORDER BY display_order;

-- Get all special roles
SELECT role, full_name
FROM special_roles
ORDER BY display_order;

-- Get all secondary sponsors
SELECT role, names
FROM secondary_sponsors
ORDER BY display_order;