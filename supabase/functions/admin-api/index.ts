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

let bootstrapDone = false;

function getClientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

function json(body: any, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ---- Auth verification ----

async function verifyAdmin(req: Request): Promise<{ adminId: string; username: string } | null> {
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "").trim();
  if (!token || token === Deno.env.get("SUPABASE_ANON_KEY")) return null;

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  const { data: admin } = await supabase
    .from("admin_users")
    .select("id, username, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (!admin || !admin.is_active) return null;
  return { adminId: admin.id, username: admin.username };
}

function requireAuth(handler: (req: Request, admin: { adminId: string; username: string }) => Promise<Response>) {
  return async (req: Request): Promise<Response> => {
    const admin = await verifyAdmin(req);
    if (!admin) return json({ error: "No autorizado" }, 401);
    return handler(req, admin);
  };
}

// ---- Rate limiting ----

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
  await supabase.rpc("cleanup_login_attempts").catch(() => {});
}

// ---- Bootstrap admin (cold-start only) ----

async function ensureBootstrapAdmin(): Promise<void> {
  if (bootstrapDone) return;

  const { data: existing } = await supabase
    .from("admin_users")
    .select("id")
    .limit(1);
  if (existing && existing.length > 0) {
    bootstrapDone = true;
    return;
  }

  const adminEmail = "admin@diamantereal.local";

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

  const { data: hashData, error: hashErr } = await supabase.rpc("hash_password_bcrypt", { p_password: "admin123" });
  if (hashErr) throw new Error(`hash failed: ${hashErr.message}`);

  const { error: insertErr } = await supabase.from("admin_users").insert({
    id: authUid,
    username: "admin",
    full_name: "Administrador Principal",
    role: "super_admin",
    is_active: true,
    password_hash: hashData as string,
  });
  if (insertErr) throw new Error(`No se pudo registrar el admin: ${insertErr.message}`);

  bootstrapDone = true;
}

// ---- Password helpers ----

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

// ---- Login ----

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

  // Look up the auth user's actual email (may have changed with username)
  const { data: authUser } = await supabase.auth.admin.getUserById(admin.id);
  const authEmail = authUser?.user?.email || "admin@diamantereal.local";

  const { data: session, error: signInErr } = await supabase.auth.signInWithPassword({
    email: authEmail,
    password: password,
  });

  // If password doesn't match the auth user (e.g. credentials were changed via
  // the admin_users table but not synced to auth), update the auth password to
  // match the current admin_users hash, then retry.
  if (signInErr || !session.session) {
    const { error: updateErr } = await supabase.auth.admin.updateUserById(admin.id, {
      password: password,
    });
    if (updateErr) {
      return json({ success: true, adminId: admin.id, username: admin.username });
    }
    const { data: retry, error: retryErr } = await supabase.auth.signInWithPassword({
      email: authEmail,
      password: password,
    });
    if (retryErr || !retry.session) {
      return json({ success: true, adminId: admin.id, username: admin.username });
    }
    return json({
      success: true,
      adminId: admin.id,
      username: admin.username,
      accessToken: retry.session.access_token,
      refreshToken: retry.session.refresh_token,
    });
  }

  return json({
    success: true,
    adminId: admin.id,
    username: admin.username,
    accessToken: session.session.access_token,
    refreshToken: session.session.refresh_token,
  });
}

// ---- Change credentials (auth-required) ----

async function handleChangeCredentials(req: Request, admin: { adminId: string; username: string }): Promise<Response> {
  const { currentPassword, newUsername, newPassword } = await req.json();
  if (!currentPassword || !newUsername || !newPassword) {
    return json({ error: "Todos los campos son obligatorios" }, 400);
  }
  if (newPassword.length < 6) {
    return json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, 400);
  }
  if (newUsername.length < 3) {
    return json({ error: "El usuario debe tener al menos 3 caracteres" }, 400);
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id, username, password_hash")
    .eq("id", admin.adminId)
    .maybeSingle();
  if (!adminRow) return json({ error: "Admin no encontrado" }, 404);

  const ok = await verifyPassword(currentPassword, adminRow.password_hash);
  if (!ok) {
    await recordAttempt(getClientIp(req), adminRow.username, false);
    return json({ error: "Contraseña actual incorrecta" }, 401);
  }

  const newHash = await hashPassword(newPassword);
  const { error } = await supabase
    .from("admin_users")
    .update({ username: newUsername, password_hash: newHash })
    .eq("id", adminRow.id);
  if (error) return json({ error: "No se actualizaron las credenciales" }, 500);

  // Update the auth user's password and email to stay in sync
  const newEmail = `${newUsername}@diamantereal.local`;
  await supabase.auth.admin.updateUserById(adminRow.id, {
    password: newPassword,
    email: newEmail,
  });

  return json({ success: true });
}

// ---- Validation helpers ----

function validateProduct(b: any, isUpdate: boolean): string | null {
  if (!b.name || typeof b.name !== "string" || b.name.trim().length === 0)
    return "El nombre del producto es obligatorio";
  if (b.price === undefined || b.price === null || typeof b.price !== "number" || b.price < 0)
    return "El precio debe ser un número válido mayor o igual a 0";
  if (!b.category || typeof b.category !== "string" || b.category.trim().length === 0)
    return "La categoría es obligatoria";
  if (b.stock === undefined || b.stock === null || typeof b.stock !== "number" || b.stock < 0 || !Number.isInteger(b.stock))
    return "El stock debe ser un número entero mayor o igual a 0";
  if (!b.branchId || typeof b.branchId !== "string")
    return "La sucursal es obligatoria";
  if (!isUpdate && b.weight !== undefined && (typeof b.weight !== "number" || b.weight < 0))
    return "El peso debe ser un número válido mayor o igual a 0";
  return null;
}

function validateBranch(b: any, isUpdate: boolean): string | null {
  if (!b.name || typeof b.name !== "string" || b.name.trim().length === 0)
    return "El nombre de la sucursal es obligatorio";
  if (b.coordinates) {
    if (typeof b.coordinates.lat !== "number" || typeof b.coordinates.lng !== "number")
      return "Las coordenadas deben ser números válidos";
  }
  return null;
}

function validateCustomer(b: any, isUpdate: boolean): string | null {
  if (!b.fullName || typeof b.fullName !== "string" || b.fullName.trim().length === 0)
    return "El nombre del cliente es obligatorio";
  if (b.email && (typeof b.email !== "string" || !b.email.includes("@")))
    return "El email no es válido";
  return null;
}

// ---- Product CRUD ----

async function handleProductAction(req: Request, method: string, admin: { adminId: string; username: string }): Promise<Response> {
  const body = method === "DELETE" ? null : await req.json().catch(() => null);

  if (method === "POST") {
    const b = body;
    const err = validateProduct(b, false);
    if (err) return json({ error: err }, 400);

    const { data: branch } = await supabase
      .from("branches")
      .select("id, name")
      .eq("id", b.branchId)
      .maybeSingle();
    if (!branch) return json({ error: "La sucursal especificada no existe" }, 400);

    const { data, error } = await supabase.from("products").insert({
      name: b.name.trim(), description: b.description || null, price: b.price, category: b.category.trim(),
      material: b.material || null, weight: b.weight || 0, size: b.size || null, gemstone: b.gemstone || null,
      certification: b.certification || null, branch_id: b.branchId, stock: b.stock,
      is_customizable: !!b.isCustomizable, crafting_time: b.craftingTime || null,
      image_url: b.image || null, additional_images: b.additionalImages || [],
      status: b.status || "available", is_active: true,
    }).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, product: mapProduct(data, branch?.name) });
  }

  if (method === "PUT") {
    const b = body;
    if (!b.id) return json({ error: "id requerido" }, 400);
    const err = validateProduct(b, true);
    if (err) return json({ error: err }, 400);

    const { data: branch } = await supabase
      .from("branches")
      .select("name")
      .eq("id", b.branchId)
      .maybeSingle();
    if (!branch) return json({ error: "La sucursal especificada no existe" }, 400);

    const { data, error } = await supabase.from("products").update({
      name: b.name.trim(), description: b.description || null, price: b.price, category: b.category.trim(),
      material: b.material || null, weight: b.weight || 0, size: b.size || null, gemstone: b.gemstone || null,
      certification: b.certification || null, branch_id: b.branchId, stock: b.stock,
      is_customizable: !!b.isCustomizable, crafting_time: b.craftingTime || null,
      image_url: b.image || null, additional_images: b.additionalImages || [],
      status: b.status || "available",
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
    additionalImages: p.additional_images || [],
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
    status: p.status || "available",
  };
}

// ---- Branch CRUD ----

async function handleBranchAction(req: Request, method: string, admin: { adminId: string; username: string }): Promise<Response> {
  const body = method === "DELETE" ? null : await req.json().catch(() => null);

  if (method === "POST") {
    const b = body;
    const err = validateBranch(b, false);
    if (err) return json({ error: err }, 400);

    const { data, error } = await supabase.from("branches").insert({
      name: b.name.trim(), address: b.address || null, city: b.city || null, state: b.state || null,
      zip_code: b.zipCode || null, phone: b.phone || null, email: b.email || null, manager: b.manager || null,
      opening_hours: b.openingHours || null, specialties: b.specialties || [], is_active: true,
      latitude: b.coordinates?.lat, longitude: b.coordinates?.lng,
    }).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, branch: mapBranch(data) });
  }

  if (method === "PUT") {
    const b = body;
    if (!b.id) return json({ error: "id requerido" }, 400);
    const err = validateBranch(b, true);
    if (err) return json({ error: err }, 400);

    const { data, error } = await supabase.from("branches").update({
      name: b.name.trim(), address: b.address || null, city: b.city || null, state: b.state || null,
      zip_code: b.zipCode || null, phone: b.phone || null, email: b.email || null, manager: b.manager || null,
      opening_hours: b.openingHours || null, specialties: b.specialties || [],
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

// ---- Sales: record a completed purchase (public — storefront checkout) ----

async function handleRecordSale(req: Request): Promise<Response> {
  const { items, total, customerEmail, customerId, branchId, paymentStatus, saleStatus, paymentMethod, notes } = await req.json();
  if (!items || !Array.isArray(items) || items.length === 0) return json({ error: "Carrito vacío" }, 400);
  if (typeof total !== "number" || total < 0) return json({ error: "Total inválido" }, 400);

  // Validate all items have required fields
  for (const it of items) {
    if (!it.product || !it.product.id || !it.product.name || typeof it.product.price !== "number") {
      return json({ error: "Producto inválido en el carrito" }, 400);
    }
    if (typeof it.quantity !== "number" || it.quantity < 1 || !Number.isInteger(it.quantity)) {
      return json({ error: "Cantidad inválida en el carrito" }, 400);
    }
  }

  // Check stock for all items BEFORE recording the sale
  for (const it of items) {
    const { data: prod } = await supabase
      .from("products")
      .select("stock, is_active")
      .eq("id", it.product.id)
      .maybeSingle();
    if (!prod || !prod.is_active) {
      return json({ error: `Producto no disponible: ${it.product.name}` }, 400);
    }
    if (prod.stock < it.quantity) {
      return json({ error: `Stock insuficiente para ${it.product.name}. Disponible: ${prod.stock}` }, 400);
    }
  }

  const { data: sale, error } = await supabase.from("sales").insert({
    customer_email: customerEmail || null,
    customer_id: customerId || null,
    branch_id: branchId || null,
    total_amount: total,
    payment_status: paymentStatus || "completed",
    status: saleStatus || "completed",
    payment_method: paymentMethod || null,
    notes: notes || null,
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

  // Atomically decrement stock and mark sold if stock reaches 0
  for (const it of items) {
    const { data: ok } = await supabase.rpc("decrement_stock", { p_product_id: it.product.id, p_qty: it.quantity });
    if (ok === false) {
      // Stock was insufficient (race condition) — the sale is already recorded,
      // but we log the discrepancy. In a real system this would trigger a review.
      console.error(`Stock mismatch for product ${it.product.id} during sale ${sale.id}`);
      continue;
    }
    const { data: prod } = await supabase.from("products").select("stock").eq("id", it.product.id).maybeSingle();
    if (prod && prod.stock <= 0) {
      await supabase.from("products").update({ status: "sold" }).eq("id", it.product.id);
    }
  }

  if (customerId) {
    await supabase.rpc("update_customer_stats", { p_customer_id: customerId }).catch(() => {});
  }

  return json({ success: true, saleId: sale.id, saleNumber: sale.sale_number });
}

// ---- Customer CRUD ----

async function handleCustomerAction(req: Request, method: string, admin: { adminId: string; username: string }): Promise<Response> {
  const body = method === "DELETE" ? null : await req.json().catch(() => null);

  if (method === "POST") {
    const b = body;
    const err = validateCustomer(b, false);
    if (err) return json({ error: err }, 400);

    const { data, error } = await supabase.from("customers").insert({
      full_name: b.fullName.trim(), phone: b.phone || null, email: b.email || null,
      address: b.address || null, city: b.city || null, notes: b.notes || null,
    }).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, customer: mapCustomer(data) });
  }

  if (method === "PUT") {
    const b = body;
    if (!b.id) return json({ error: "id requerido" }, 400);
    const err = validateCustomer(b, true);
    if (err) return json({ error: err }, 400);

    const { data, error } = await supabase.from("customers").update({
      full_name: b.fullName.trim(), phone: b.phone || null, email: b.email || null,
      address: b.address || null, city: b.city || null, notes: b.notes || null,
      updated_at: new Date().toISOString(),
    }).eq("id", b.id).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, customer: mapCustomer(data) });
  }

  if (method === "DELETE") {
    const id = new URL(req.url).searchParams.get("id");
    if (!id) return json({ error: "id requerido" }, 400);
    const { error } = await supabase.from("customers").delete().eq("id", id);
    if (error) return json({ error: error.message }, 500);
    return json({ success: true });
  }

  return json({ error: "Método no soportado" }, 405);
}

function mapCustomer(c: any): any {
  return {
    id: c.id,
    fullName: c.full_name,
    phone: c.phone || "",
    email: c.email || "",
    address: c.address || "",
    city: c.city || "",
    notes: c.notes || "",
    totalPurchases: c.total_purchases || 0,
    totalSpent: Number(c.total_spent) || 0,
    createdAt: c.created_at,
  };
}

// ---- Sales management ----

async function handleSaleAction(req: Request, method: string, admin: { adminId: string; username: string }): Promise<Response> {
  if (method === "GET") {
    const { data, error } = await supabase
      .from("sales")
      .select("*, sale_items(*), customers(full_name, phone, email)")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) return json({ error: error.message }, 500);
    return json({ sales: (data || []).map(mapSaleWithCustomer) });
  }

  if (method === "PUT") {
    const b = await req.json();
    if (!b.id) return json({ error: "id requerido" }, 400);
    const updates: any = { updated_at: new Date().toISOString() };
    if (b.status !== undefined) updates.status = b.status;
    if (b.paymentStatus !== undefined) updates.payment_status = b.paymentStatus;
    if (b.paymentMethod !== undefined) updates.payment_method = b.paymentMethod;
    if (b.notes !== undefined) updates.notes = b.notes;
    if (b.customerId !== undefined) updates.customer_id = b.customerId || null;
    const { data, error } = await supabase.from("sales").update(updates).eq("id", b.id).select().single();
    if (error) return json({ error: error.message }, 500);
    return json({ success: true, sale: mapSaleWithCustomer(data) });
  }

  return json({ error: "Método no soportado" }, 405);
}

function mapSaleWithCustomer(s: any): any {
  return {
    id: s.id,
    saleNumber: s.sale_number,
    date: s.created_at,
    total: Number(s.total_amount),
    status: s.status || s.payment_status || "completed",
    paymentStatus: s.payment_status,
    paymentMethod: s.payment_method,
    notes: s.notes,
    customer: s.customers ? {
      fullName: s.customers.full_name,
      phone: s.customers.phone,
      email: s.customers.email,
    } : null,
    customerEmail: s.customer_email,
    branchId: s.branch_id,
    items: (s.sale_items || []).map((it: any) => ({
      productId: it.product_id,
      productName: it.product_name,
      productPrice: Number(it.product_price),
      quantity: it.quantity,
      subtotal: Number(it.subtotal),
    })),
  };
}

// ---- Store settings ----

async function handleSettings(req: Request, method: string, admin: { adminId: string; username: string }): Promise<Response> {
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
    if (b.storeName !== undefined) {
      if (typeof b.storeName !== "string" || b.storeName.trim().length === 0)
        return json({ error: "El nombre de la tienda es obligatorio" }, 400);
      updates.store_name = b.storeName.trim();
    }
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

// ============================================================
// Router
// ============================================================

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/admin-api/, "");
  const ip = getClientIp(req);

  try {
    // Public routes (no auth required)
    if (path === "/login" && req.method === "POST") return await handleLogin(req, ip);
    if (path === "/sale" && req.method === "POST") return await handleRecordSale(req);

    // Settings GET is public (storefront needs to read settings)
    if (path === "/settings" && req.method === "GET") {
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

    // Authenticated routes
    if (path === "/change-credentials" && req.method === "POST") {
      return await requireAuth(handleChangeCredentials)(req);
    }
    if (path === "/product" && ["POST", "PUT", "DELETE"].includes(req.method)) {
      return await requireAuth((r, a) => handleProductAction(r, req.method, a))(req);
    }
    if (path === "/branch" && ["POST", "PUT", "DELETE"].includes(req.method)) {
      return await requireAuth((r, a) => handleBranchAction(r, req.method, a))(req);
    }
    if (path === "/sales" && ["GET", "PUT"].includes(req.method)) {
      return await requireAuth((r, a) => handleSaleAction(r, req.method, a))(req);
    }
    if (path === "/customer" && ["POST", "PUT", "DELETE"].includes(req.method)) {
      return await requireAuth((r, a) => handleCustomerAction(r, req.method, a))(req);
    }
    if (path === "/settings" && req.method === "PUT") {
      return await requireAuth((r, a) => handleSettings(r, "PUT", a))(req);
    }

    return json({ error: "Ruta no encontrada" }, 404);
  } catch (err) {
    return json({ error: err.message || "Error interno" }, 500);
  }
});
