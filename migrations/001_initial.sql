CREATE TABLE rooms(id text PRIMARY KEY,capacity integer NOT NULL CHECK(capacity BETWEEN 1 AND 100));
CREATE TABLE reservations(id text PRIMARY KEY,room text NOT NULL REFERENCES rooms(id),seats integer NOT NULL CHECK(seats BETWEEN 1 AND 100),active boolean NOT NULL);
CREATE INDEX reservations_room ON reservations(room);
