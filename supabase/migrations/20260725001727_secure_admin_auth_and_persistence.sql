/*
# Secure admin authentication, rate limiting, and data persistence

## Summary

This migration makes the admin login secure and makes product/branch/sale data
persist in the database instead of in-memory React state.

1. **Secure credentials** — Add `password_hash` column to `admin_users` (bcrypt
   via pgcrypto `crypt()`/`gen_salt('bf')`). The edge function creates the
   initial admin auth user + admin_users row on first deploy, so the plaintext
   password never lives in the database.

2. **Rate limiting** — Create a `login_attempts` table that records every
   login attempt (success or failure) keyed by IP address and username. The
   edge function reads this table to enforce a maximum of 5 failed attempts
   per 15-minute window per IP, with exponential backoff messaging. This
   prevents brute-force attacks on the admin login.

3. **Seed data** — Insert the 3 default branches and 18 default products so
   the storefront is populated on first load. Products reference branches via
   foreign key.

4. **RLS policies** — The storefront (anon) needs to READ products, branches,
   sales, and sale_items. Admin writes go through an edge function using the
   service role key, which bypasses RLS. `login_attempts` is locked to anon
   (no policies) so only the service-role edge function can read/write it.

## New Tables
- `login_attempts` — tracks login attempts for rate limiting.

## Modified Tables
- `admin_users` — added `password_hash text` column (nullable).

## Security
- `login_attempts`: RLS enabled, NO policies → anon cannot read or write.
- `products` / `branches` / `sales` / `sale_items`: anon+authenticated SELECT.
- Writes remain service-role-only (via edge function).

## Important Notes
1. The default admin is created by the edge function on first login attempt
   (it bootstraps an auth user + admin_users row with a bcrypt hash). The
   user should change the password after first login.
2. Idempotent: uses IF NOT EXISTS guards and NOT EXISTS checks for seeds.
*/

-- 1. Add password_hash to admin_users
ALTER TABLE admin_users
  ADD COLUMN IF NOT EXISTS password_hash text;

-- 2. login_attempts table for rate limiting
CREATE TABLE IF NOT EXISTS login_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address text NOT NULL,
  username text NOT NULL,
  success boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
  ON login_attempts (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_username_time
  ON login_attempts (username, created_at DESC);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. Seed default branches (idempotent by unique name)
INSERT INTO branches (name, address, city, state, zip_code, phone, email, manager, opening_hours, specialties, is_active, latitude, longitude)
SELECT 'Diamante Real Centro','Av. Principal 123','Ciudad Principal','Estado Central','12345','+1 (555) 123-4567','centro@diamantereal.com','María González','{"monday":"9:00 AM - 7:00 PM","tuesday":"9:00 AM - 7:00 PM","wednesday":"9:00 AM - 7:00 PM","thursday":"9:00 AM - 7:00 PM","friday":"9:00 AM - 8:00 PM","saturday":"10:00 AM - 8:00 PM","sunday":"12:00 PM - 6:00 PM"}'::jsonb,ARRAY['Anillos de Compromiso','Joyas Personalizadas','Reparaciones'],true,40.7128,-74.0060
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Diamante Real Centro');

INSERT INTO branches (name, address, city, state, zip_code, phone, email, manager, opening_hours, specialties, is_active, latitude, longitude)
SELECT 'Diamante Real Plaza Norte','Centro Comercial Plaza Norte, Local 205','Ciudad Norte','Estado Central','12346','+1 (555) 234-5678','plazanorte@diamantereal.com','Carlos Rodríguez','{"monday":"10:00 AM - 9:00 PM","tuesday":"10:00 AM - 9:00 PM","wednesday":"10:00 AM - 9:00 PM","thursday":"10:00 AM - 9:00 PM","friday":"10:00 AM - 10:00 PM","saturday":"10:00 AM - 10:00 PM","sunday":"12:00 PM - 8:00 PM"}'::jsonb,ARRAY['Relojes de Lujo','Cadenas de Oro','Aretes Diamante'],true,40.7589,-73.9851
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Diamante Real Plaza Norte');

INSERT INTO branches (name, address, city, state, zip_code, phone, email, manager, opening_hours, specialties, is_active, latitude, longitude)
SELECT 'Diamante Real Boutique','Zona Rosa, Calle Exclusiva 456','Ciudad Exclusiva','Estado Premium','12347','+1 (555) 345-6789','boutique@diamantereal.com','Ana Martínez','{"monday":"11:00 AM - 8:00 PM","tuesday":"11:00 AM - 8:00 PM","wednesday":"11:00 AM - 8:00 PM","thursday":"11:00 AM - 8:00 PM","friday":"11:00 AM - 9:00 PM","saturday":"10:00 AM - 9:00 PM","sunday":"Cerrado"}'::jsonb,ARRAY['Joyas de Diseñador','Piedras Preciosas','Colecciones Exclusivas'],true,40.7505,-73.9934
WHERE NOT EXISTS (SELECT 1 FROM branches WHERE name = 'Diamante Real Boutique');

-- 4. Seed default products (idempotent by name + branch)
DO $$
DECLARE
  b_centro uuid; b_plaza uuid; b_boutique uuid;
BEGIN
  SELECT id INTO b_centro FROM branches WHERE name = 'Diamante Real Centro';
  SELECT id INTO b_plaza FROM branches WHERE name = 'Diamante Real Plaza Norte';
  SELECT id INTO b_boutique FROM branches WHERE name = 'Diamante Real Boutique';

  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Anillo de Compromiso Solitario' AND branch_id = b_centro) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Anillo de Compromiso Solitario','Elegante anillo de compromiso con diamante solitario de 1 quilate, montado en oro blanco de 18k',2500,'Anillos','Oro Blanco 18k',3.5,'Ajustable','Diamante 1ct','GIA Certificado',b_centro,8,true,7,'https://images.pexels.com/photos/1232931/pexels-photo-1232931.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Collar de Perlas Cultivadas' AND branch_id = b_plaza) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Collar de Perlas Cultivadas','Hermoso collar de perlas cultivadas de agua dulce con broche de oro amarillo',450,'Collares','Oro Amarillo 14k',25.0,'45cm','Perlas Cultivadas',NULL,b_plaza,12,false,NULL,'https://images.pexels.com/photos/1454171/pexels-photo-1454171.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Aretes de Esmeralda' AND branch_id = b_boutique) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Aretes de Esmeralda','Exquisitos aretes con esmeraldas colombianas y diamantes en oro blanco',1800,'Aretes','Oro Blanco 18k',4.2,'Mediano','Esmeralda + Diamantes','Certificado de Origen',b_boutique,6,true,10,'https://images.pexels.com/photos/1454172/pexels-photo-1454172.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Reloj de Oro Rosa' AND branch_id = b_plaza) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Reloj de Oro Rosa','Elegante reloj suizo con caja de oro rosa y correa de cuero genuino',3200,'Relojes','Oro Rosa 18k',85.0,'42mm',NULL,NULL,b_plaza,4,false,NULL,'https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pulsera de Diamantes' AND branch_id = b_centro) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Pulsera de Diamantes','Deslumbrante pulsera con diamantes engarzados en oro blanco',2800,'Pulseras','Oro Blanco 18k',12.5,'18cm','Diamantes 2.5ct total','GIA Certificado',b_centro,5,true,14,'https://images.pexels.com/photos/1454173/pexels-photo-1454173.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Cadena de Oro Amarillo' AND branch_id = b_plaza) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Cadena de Oro Amarillo','Cadena clásica de oro amarillo de 24k, perfecta para cualquier ocasión',680,'Cadenas','Oro Amarillo 24k',18.0,'50cm',NULL,NULL,b_plaza,15,false,NULL,'https://images.pexels.com/photos/1454174/pexels-photo-1454174.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Anillo de Compromiso Halo' AND branch_id = b_boutique) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Anillo de Compromiso Halo','Espectacular anillo con diamante central rodeado de diamantes más pequeños en oro blanco',3500,'Anillos','Oro Blanco 18k',4.8,'Ajustable','Diamante 1.5ct + Halo','GIA Certificado',b_boutique,3,true,10,'https://images.pexels.com/photos/1454175/pexels-photo-1454175.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Collar de Diamantes Rivière' AND branch_id = b_boutique) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Collar de Diamantes Rivière','Elegante collar rivière con diamantes graduados en oro blanco',5200,'Collares','Oro Blanco 18k',15.2,'40cm','Diamantes 3ct total','GIA Certificado',b_boutique,2,false,NULL,'https://images.pexels.com/photos/1454176/pexels-photo-1454176.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Aretes de Perlas Tahití' AND branch_id = b_centro) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Aretes de Perlas Tahití','Sofisticados aretes con perlas negras de Tahití y diamantes',1200,'Aretes','Oro Blanco 14k',6.3,'Grande','Perlas Tahití + Diamantes','Certificado de Origen',b_centro,8,false,NULL,'https://images.pexels.com/photos/1454177/pexels-photo-1454177.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Reloj de Diamantes para Dama' AND branch_id = b_boutique) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Reloj de Diamantes para Dama','Reloj de lujo con caja y brazalete engastados con diamantes',4800,'Relojes','Oro Blanco 18k',65.0,'28mm','Diamantes 1.2ct total','Certificado Suizo',b_boutique,2,false,NULL,'https://images.pexels.com/photos/1454178/pexels-photo-1454178.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pulsera Tennis de Zafiros' AND branch_id = b_plaza) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Pulsera Tennis de Zafiros','Elegante pulsera tennis con zafiros azules y diamantes alternados',3800,'Pulseras','Oro Blanco 18k',14.7,'19cm','Zafiros + Diamantes','GIA Certificado',b_plaza,4,true,12,'https://images.pexels.com/photos/1454179/pexels-photo-1454179.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Cadena Cubana de Oro' AND branch_id = b_centro) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Cadena Cubana de Oro','Imponente cadena cubana de oro amarillo macizo, perfecta para hombres',2200,'Cadenas','Oro Amarillo 18k',45.0,'60cm',NULL,NULL,b_centro,6,false,NULL,'https://images.pexels.com/photos/1454180/pexels-photo-1454180.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Anillo de Rubí Birmano' AND branch_id = b_boutique) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Anillo de Rubí Birmano','Exclusivo anillo con rubí birmano natural y diamantes laterales',4200,'Anillos','Platino',5.2,'Ajustable','Rubí Birmano 2ct + Diamantes','Certificado Gübelin',b_boutique,1,true,15,'https://images.pexels.com/photos/1454181/pexels-photo-1454181.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Collar de Perlas Australianas' AND branch_id = b_plaza) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Collar de Perlas Australianas','Lujoso collar de perlas australianas doradas con broche de diamantes',3600,'Collares','Oro Amarillo 18k',32.0,'50cm','Perlas Australianas + Diamantes','Certificado de Origen',b_plaza,3,false,NULL,'https://images.pexels.com/photos/1454182/pexels-photo-1454182.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Aretes Chandelier de Diamantes' AND branch_id = b_boutique) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Aretes Chandelier de Diamantes','Espectaculares aretes chandelier con múltiples niveles de diamantes',6800,'Aretes','Oro Blanco 18k',8.9,'Extra Grande','Diamantes 4ct total','GIA Certificado',b_boutique,2,true,20,'https://images.pexels.com/photos/1454183/pexels-photo-1454183.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Reloj Cronógrafo de Oro' AND branch_id = b_centro) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Reloj Cronógrafo de Oro','Reloj cronógrafo suizo de oro amarillo con funciones múltiples',5500,'Relojes','Oro Amarillo 18k',120.0,'44mm',NULL,'Certificado Suizo',b_centro,3,false,NULL,'https://images.pexels.com/photos/1454184/pexels-photo-1454184.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Pulsera de Esmeraldas Colombianas' AND branch_id = b_boutique) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Pulsera de Esmeraldas Colombianas','Exclusiva pulsera con esmeraldas colombianas y diamantes',7200,'Pulseras','Platino',18.5,'17cm','Esmeraldas Colombianas + Diamantes','Certificado de Origen',b_boutique,1,true,25,'https://images.pexels.com/photos/1454185/pexels-photo-1454185.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM products WHERE name = 'Cadena Rope de Oro Blanco' AND branch_id = b_plaza) THEN
    INSERT INTO products (name, description, price, category, material, weight, size, gemstone, certification, branch_id, stock, is_customizable, crafting_time, image_url, is_active)
    VALUES ('Cadena Rope de Oro Blanco','Elegante cadena rope de oro blanco con acabado brillante',1800,'Cadenas','Oro Blanco 18k',28.0,'55cm',NULL,NULL,b_plaza,8,false,NULL,'https://images.pexels.com/photos/1454186/pexels-photo-1454186.jpeg?auto=compress&cs=tinysrgb&w=500',true);
  END IF;
END $$;

-- 5. RLS policies: anon can READ products, branches, sales, sale_items
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_products" ON products;
CREATE POLICY "anon_read_products" ON products FOR SELECT
  TO anon, authenticated USING (is_active = true);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_branches" ON branches;
CREATE POLICY "anon_read_branches" ON branches FOR SELECT
  TO anon, authenticated USING (is_active = true);

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_sales" ON sales;
CREATE POLICY "anon_read_sales" ON sales FOR SELECT
  TO anon, authenticated USING (true);

ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_read_sale_items" ON sale_items;
CREATE POLICY "anon_read_sale_items" ON sale_items FOR SELECT
  TO anon, authenticated USING (true);
