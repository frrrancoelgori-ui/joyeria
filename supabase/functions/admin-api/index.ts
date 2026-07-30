import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const MAX_ATTEMPTS = 5;
const WINDOW_MINUTES = 15;
const LOCKOUT_SECONDS = 60;

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

async function checkRateLimit(ip: string): Promise<{ locked: boolean; remaining: number; retryAfter: number }> {
  const since = new Date(Date.now() - WINDOW_MINUTES * 60 * 1000).toISOString();
  const { data: recent } = await supabase
    .from("login_attempts")
    .select("id, success, created_at")
    .eq("ip_address", ip)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const attempts = recent || [];
  const failed = attempts.filter((a: any) => !a.success);
  if (failed.length >= MAX_ATTEMPTS) {
    const last = new Date(failed[0].created_at).getTime();
    const elapsed = Math.floor((Date.now() - last) / 1000);
    const retryAfter = Math.max(0, LOCKOUT_SECONDS - elapsed);
    return { locked: true, remaining: 0, retryAfter };
  }
  return { locked: false, remaining: MAX_ATTEMPTS - failed.length, retryAfter: 0 };
}

async function recordAttempt(ip: string, username: string, success: boolean) {
  await supabase.from("login_attempts").insert({ ip_address: ip, username, success });
}

async function ensureBootstrapAdmin(): Promise<void> {
  const { data: existing } = await supabase
    .from("admin_users")
    .select("id")
    .limit(1);
  if (existing && existing.length > 0) return;

  const adminEmail = "admin@diamantereal.local";

  // Try to find an existing auth user first (a previous deploy may have
  // created it but failed before inserting the admin_users row).
  let authUid: string | null = null;
  const { data: existingUser } = await supabase.auth.admin.listUsers();
  if (existingUser?.users) {
    const found = existingUser.users.find((u: any) => u.email === adminEmail);
    if (found) authUid = found.id;
  }

  if (!authUid) {
    const { data: authUser, error: authErr } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: "admin123",
      email_confirm: true,
    });
    if (authErr) throw new Error(`No se pudo crear el usuario admin inicial: ${authErr.message}`);
    authUid = authUser.user.id;
  }

  const { error: insertErr } = await supabase.from("admin_users").insert({
    id: authUid,
    username: "admin",
    full_name: "Administrador Principal",
    role: "super_admin",
    is_active: true,
    password_hash: await hashPassword("admin123"),
  });
  if (insertErr) throw new Error(`No se pudo registrar el admin: ${insertErr.message}`);
}

async function hashPassword(password: string): Promise<string> {
  const { data, error } = await supabase.rpc("hash_password_bcrypt", { p_password: password });
  if (error) throw new Error(`hash failed: ${error.message}`);
  return data as string;
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const { data, error } = await supabase.rpc("verify_password_bcrypt", {
    p_password: password,
    p_hash: hash,
  });
  if (error) return false;
  return data === true;
}

async function handleLogin(req: Request, ip: string): Promise<Response> {
  const { username, password } = await req.json();
  if (!username || !password) {
    return json({ error: "Usuario y contraseña son obligatorios" }, 400);
  }

  await ensureBootstrapAdmin();

  const rl = await checkRateLimit(ip);
  if (rl.locked) {
    return json({
      error: `Demasiados intentos. Intenta de nuevo en ${rl.retryAfter}s.`,
      retryAfter: rl.retryAfter,
    }, 429);
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, username, password_hash, is_active")
    .eq("username", username)
    .maybeSingle();

  if (!admin || !admin.is_active || !admin.password_hash) {
    await recordAttempt(ip, username, false);
    return json({ error: "Credenciales incorrectas", remaining: rl.remaining - 1 }, 401);
  }

  const ok = await verifyPassword(password, admin.password_hash);
  if (!ok) {
    await recordAttempt(ip, username, false);
    return json({ error: "Credenciales incorrectas", remaining: rl.remaining - 1 }, 401);
  }

  await recordAttempt(ip, username, true);
  await supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", admin.id);

  // Issue a session token via Supabase auth (password sign-in)
  const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({
    email: "admin@diamantereal.local",
    password: password,
  });
  if (signInErr || !session.session) {
    // Fallback: return a simple success with admin id (the storefront uses
    // isAuthenticated state; the token is a bonus for service calls).
    return json({ success: true, adminId: admin.id, username: admin.username });
  }
  return json({
    success: true,
    adminId: admin.id,
    username: admin.username,
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
  });
}

async function handleChangeCredentials(req: Request, ip: string): Promise<Response> {
  const { currentPassword, newUsername, newPassword } = await req.json();
  if (!currentPassword || !newUsername || !newPassword) {
    return json({ error: "Todos los campos son obligatorios" }, 400);
  }
  if (newPassword.length < 6) {
    return json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, 400);
  }

  await ensureBootstrapAdmin();

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, username, password_hash")
    .limit(1)
    .maybeSingle();
  if (!admin) return json({ error: "Admin no encontrado" }, 404);

  const ok = await verifyPassword(currentPassword, admin.password_hash);
  if (!ok) {
    await recordAttempt(ip, admin.username, false);
    return json({ error: "Contraseña actual incorrecta" }, 401);
  }

  const newHash = await hashPassword(newPassword);
  const { error } = await supabase
    .from("admin_users")
    .update({ username: newUsername, password_hash: newHash })
    .eq("id", admin.id);
  if (error) return json({ error: "No se actualizaron las credenciales" }, 500);

  // Also update the auth user password so the session token stays valid
  await supabase.auth.admin.updateUserById(admin.id, {
    password: newPassword,
    email: `${newUsername}@diamantereal.local`,
  });

  return json({ success: true });
}

// ---- Product CRUD (service role, bypasses RLS) ----

async function handleProductAction(req: Request, method: string): Promise<Response> {
  const body = method === "GET" ? null : await req.json().catch(() => null);

  if (method === "POST") {
    const b = body;
    const { data: branch } = await supabase
      .from("branches")
      .select("id, name")
      .eq("id", b.branchId)
      .maybeSingle();
    const { data, error } = await supabase.from("products").insert({
      name: b.name, description: b.description, price: b.price, category: b.category,
      material: b.material, weight: b.weight, size: b.size, gemstone: b.gemstone || null,
      certification: b.certification || null, branch_id: b.branchId, stock: b.stock,
      is_customizable: b.isCustomizable, crafting_time: b.craftingTime || null,
      image_url: b.image, is_active: true,
    }).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, product: mapProduct(data, branch?.name) });
  }

  if (method === "PUT") {
    const b = body;
    const { data: branch } = await supabase
      .from("branches")
      .select("name")
      .eq("id", b.branchId)
      .maybeSingle();
    const { data, error } = await supabase.from("products").update({
      name: b.name, description: b.description, price: b.price, category: b.category,
      material: b.material, weight: b.weight, size: b.size, gemstone: b.gemstone || null,
      certification: b.certification || null, branch_id: b.branchId, stock: b.stock,
      is_customizable: b.isCustomizable, crafting_time: b.craftingTime || null,
      image_url: b.image,
    }).eq("id", b.id).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, product: mapProduct(data, branch?.name) });
  }

  if (method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return json({ error: "id requerido" }, 400);
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ success: true });
  }

  return json({ error: "Método no soportado" }, 405);
}

function mapProduct(p: any, branchName?: string): any {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    image: p.image_url,
    category: p.category,
    stock: p.stock,
    material: p.material,
    weight: Number(p.weight),
    size: p.size,
    gemstone: p.gemstone || undefined,
    certification: p.certification || undefined,
    branchId: p.branch_id,
    branchName: branchName || "",
    isCustomizable: p.is_customizable,
    craftingTime: p.crafting_time || undefined,
  };
}

// ---- Branch CRUD ----

async function handleBranchAction(req: Request, method: string): Promise<Response> {
  const body = method === "GET" ? null : await req.json().catch(() => null);

  if (method === "POST") {
    const b = body;
    const { data, error } = await supabase.from("branches").insert({
      name: b.name, address: b.address, city: b.city, state: b.state,
      zip_code: b.zipCode, phone: b.phone, email: b.email, manager: b.manager,
      opening_hours: b.openingHours, specialties: b.specialties, is_active: true,
      latitude: b.coordinates?.lat, longitude: b.coordinates?.lng,
    }).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, branch: mapBranch(data) });
  }

  if (method === "PUT") {
    const b = body;
    const { data, error } = await supabase.from("branches").update({
      name: b.name, address: b.address, city: b.city, state: b.state,
      zip_code: b.zipCode, phone: b.phone, email: b.email, manager: b.manager,
      opening_hours: b.openingHours, specialties: b.specialties,
      latitude: b.coordinates?.lat, longitude: b.coordinates?.lng,
    }).eq("id", b.id).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, branch: mapBranch(data) });
  }

  if (method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return json({ error: "id requerido" }, 400);
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq("branch_id", id);
    if (count && count > 0) return json({ error: `Esta sucursal tiene ${count} productos en inventario` }, 400);
    const { error } = await supabase.from("branches").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ success: true });
  }

  return json({ error: "Método no soportado" }, 405);
}

function mapBranch(b: any): any {
  return {
    id: b.id,
    name: b.name,
    address: b.address,
    phone: b.phone,
    email: b.email,
    manager: b.manager,
    city: b.city,
    state: b.state,
    zipCode: b.zip_code,
    openingHours: b.opening_hours,
    specialties: b.specialties,
    isActive: b.is_active,
    coordinates: b.latitude && b.longitude ? { lat: Number(b.latitude), lng: Number(b.longitude) } : undefined,
  };
}

// ---- Sales: record a completed purchase ----

async function handleRecordSale(req: Request): Promise<Response> {
  const { items, total, customerEmail, branchId } = await req.json();
  if (!items || items.length === 0) return json({ error: "Carrito vacío" }, 400);

  const { data: sale, error } = await supabase.from("sales").insert({
    customer_email: customerEmail || null,
    branch_id: branchId || null,
    total_amount: total,
    payment_status: "completed",
  }).select().single();
  if (error) return json({ error: error.message }, 500);

  const rows = items.map((it: any) => ({
    sale_id: sale.id,
    product_id: it.product.id,
    product_name: it.product.name,
    product_price: it.product.price,
    quantity: it.quantity,
    subtotal: it.product.price * it.quantity,
  }));
  const { error: itemErr } = await supabase.from("sale_items").insert(rows);
  if (itemErr) return json({ error: itemErr.message }, 500);

  // Decrement stock
  for (const it of items) {
    await supabase.rpc("decrement_stock", { p_product_id: it.product.id, p_qty: it.quantity });
  }

  return json({ success: true, saleId: sale.id });
}

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---- Store settings ----

async function handleSettings(req: Request, method: string): Promise<Response> {
  if (method === "GET") {
    const { data, error } = await supabase
      .from("store_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!data) return json({ error: "No settings found" }, 404);
    return json({
      storeName: data.store_name,
      whatsappNumber: data.whatsapp_number,
      logoUrl: data.logo_url,
    });
  }

  if (method === "PUT") {
    const b = await req.json();
    const updates: any = { updated_at: new Date().toISOString() };
    if (b.storeName !== undefined) updates.store_name = b.storeName;
    if (b.whatsappNumber !== undefined) updates.whatsapp_number = b.whatsappNumber;
    if (b.logoUrl !== undefined) updates.logo_url = b.logoUrl || null;

    const { data, error } = await supabase
      .from("store_settings")
      .update(updates)
      .eq("id", 1)
      .select("*")
      .single();
    if (error) return json({ error: error.message }, 500);
    return json({
      success: true,
      settings: {
        storeName: data.store_name,
        whatsappNumber: data.whatsapp_number,
        logoUrl: data.logo_url,
      },
    });
  }

  return json({ error: "Método no soportado" }, 405);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin-api/, "");
  const ip = getClientIp(req);

  try {
    if (path === "/login" && req.method === "POST") return await handleLogin(req, ip);
    if (path === "/change-credentials" && req.method === "POST") return await handleChangeCredentials(req, ip);
    if (path === "/product" && ["POST", "PUT", "DELETE"].includes(req.method)) return await handleProductAction(req, req.method);
    if (path === "/branch" && ["POST", "PUT", "DELETE"].includes(req.method)) return await handleBranchAction(req, req.method);
    if (path === "/sale" && req.method === "POST") return await handleRecordSale(req);
    if (path === "/settings" && ["GET", "PUT"].includes(req.method)) return await handleSettings(req, req.method);
    return json({ error: "Ruta no encontrada" }, 404);
  } catch (err) {
    return json({ error: err.message || "Error interno" }, 500);
  }
});
