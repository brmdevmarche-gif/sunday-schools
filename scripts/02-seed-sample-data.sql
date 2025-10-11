-- Sample data for Sunday School Management System
-- This script populates the database with sample data for testing

-- Insert sample diocese
INSERT INTO diocese (name, location, bishop_name, contact_email, contact_phone) VALUES
('Diocese of Alexandria', 'Alexandria, Egypt', 'Bishop Marcos', 'bishop@alexandria-diocese.org', '+20-3-123-4567'),
('Diocese of Cairo', 'Cairo, Egypt', 'Bishop Antonios', 'bishop@cairo-diocese.org', '+20-2-987-6543');

-- Insert sample churches
INSERT INTO churches (name, diocese_id, address, contact_email, contact_phone, priest_name, established_date) VALUES
('St. Mark Church', 1, '123 Church Street, Alexandria', 'info@stmark-alex.org', '+20-3-111-2222', 'Father Michael', '1950-01-15'),
('Holy Family Church', 1, '456 Faith Avenue, Alexandria', 'contact@holyfamily-alex.org', '+20-3-333-4444', 'Father John', '1965-03-20'),
('St. Mary Church', 2, '789 Prayer Road, Cairo', 'admin@stmary-cairo.org', '+20-2-555-6666', 'Father Peter', '1940-12-10');

-- Insert sample servants
INSERT INTO servants (church_id, first_name, last_name, email, phone, date_of_birth, role, specialization, start_date) VALUES
(1, 'Sarah', 'Johnson', 'sarah.johnson@email.com', '+20-10-111-1111', '1985-06-15', 'Teacher', 'Youth Ministry', '2020-09-01'),
(1, 'David', 'Smith', 'david.smith@email.com', '+20-10-222-2222', '1978-03-22', 'Coordinator', 'Music Ministry', '2019-01-15'),
(2, 'Mary', 'Wilson', 'mary.wilson@email.com', '+20-10-333-3333', '1982-11-08', 'Teacher', 'Arts and Crafts', '2021-02-01'),
(3, 'Joseph', 'Brown', 'joseph.brown@email.com', '+20-10-444-4444', '1975-09-12', 'Assistant', 'Sports Activities', '2018-08-20');

-- Insert sample class groups
INSERT INTO class_groups (church_id, name, description, age_range, max_capacity, primary_servant_id) VALUES
(1, 'Little Angels', 'Kindergarten Sunday School Class', '4-6 years', 15, 1),
(1, 'Young Disciples', 'Elementary Sunday School Class', '7-10 years', 20, 2),
(2, 'Faith Builders', 'Middle School Sunday School Class', '11-14 years', 18, 3),
(3, 'Youth Warriors', 'High School Sunday School Class', '15-18 years', 25, 4);

-- Insert sample students
INSERT INTO students (church_id, class_group_id, first_name, last_name, date_of_birth, gender, parent_guardian_name, parent_guardian_phone, parent_guardian_email) VALUES
(1, 1, 'Emma', 'Davis', '2018-04-12', 'Female', 'Jennifer Davis', '+20-10-555-1111', 'jennifer.davis@email.com'),
(1, 1, 'Noah', 'Miller', '2017-08-25', 'Male', 'Robert Miller', '+20-10-555-2222', 'robert.miller@email.com'),
(1, 2, 'Olivia', 'Garcia', '2014-12-03', 'Female', 'Maria Garcia', '+20-10-555-3333', 'maria.garcia@email.com'),
(2, 3, 'Liam', 'Rodriguez', '2010-07-18', 'Male', 'Carlos Rodriguez', '+20-10-555-4444', 'carlos.rodriguez@email.com'),
(3, 4, 'Sophia', 'Martinez', '2007-02-14', 'Female', 'Ana Martinez', '+20-10-555-5555', 'ana.martinez@email.com');

-- Insert sample church activities
INSERT INTO church_activities (church_id, name, description, activity_type, start_date, end_date, start_time, end_time, max_participants, organizer_servant_id) VALUES
(1, 'Christmas Pageant', 'Annual Christmas celebration with nativity play', 'Event', '2024-12-24', '2024-12-24', '18:00', '20:00', 100, 1),
(1, 'Summer Bible Camp', 'Week-long summer camp for children', 'Camp', '2024-07-15', '2024-07-19', '09:00', '15:00', 50, 2),
(2, 'Youth Retreat', 'Spiritual retreat for teenagers', 'Retreat', '2024-08-10', '2024-08-12', '10:00', '16:00', 30, 3),
(3, 'Community Service Day', 'Volunteer work in the local community', 'Service', '2024-06-01', '2024-06-01', '08:00', '17:00', 40, 4);

-- Insert sample offers
INSERT INTO offers (church_id, title, description, offer_type, discount_percentage, valid_from, valid_until, max_uses) VALUES
(1, 'New Family Discount', '50% off first year activities for new families', 'Discount', 50.00, '2024-01-01', '2024-12-31', 20),
(2, 'Sibling Scholarship', 'Free enrollment for third child and beyond', 'Scholarship', 100.00, '2024-01-01', '2024-12-31', 10),
(3, 'Summer Camp Early Bird', '25% discount for early summer camp registration', 'Discount', 25.00, '2024-03-01', '2024-05-31', 50);

-- Insert sample lessons
INSERT INTO lessons (church_id, class_group_id, title, description, scripture_reference, lesson_date, duration_minutes, teacher_servant_id) VALUES
(1, 1, 'God Created the World', 'Learning about creation story', 'Genesis 1:1-31', '2024-01-07', 45, 1),
(1, 2, 'Jesus Loves Children', 'Understanding Jesus love for children', 'Matthew 19:13-15', '2024-01-07', 60, 2),
(2, 3, 'The Good Samaritan', 'Parable about helping others', 'Luke 10:25-37', '2024-01-07', 50, 3),
(3, 4, 'Faith and Courage', 'Stories of biblical heroes', 'Hebrews 11:1-40', '2024-01-07', 75, 4);
