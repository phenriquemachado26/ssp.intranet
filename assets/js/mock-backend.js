/*
 * Mock de backend 100% client-side para o protótipo da Intranet SSP.
 * Substitui o antigo servidor Python + SQLite (app.py). Intercepta fetch('/api/...')
 * e persiste tudo em localStorage — não existe banco de dados real nem servidor.
 * Cada navegador mantém sua própria cópia dos dados (sem compartilhamento entre visitantes).
 */
(() => {
  const DB_KEY = 'sspIntranetDb';
  const SESSION_KEY = 'sspIntranetSession';
  const SESSION_HOURS = 8;

  // Manifesto estático dos arquivos hoje presentes em images_banner/.
  // Não há mais listagem dinâmica de diretório (sem servidor): ao adicionar um novo banner,
  // é necessário incluir o nome do arquivo aqui também.
  const BANNER_FILES = [
    'SPTodas.gif', 'Arrecadacao.png', 'banner_periodoeleitoral.png',
    'Hospitalidades.png', 'Teste.png', 'AcessoRapido.png',
    'CasaPaulista.png', 'MuralhaPaulista.png',
  ];
  const BANNER_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.avif']);
  const PROFILE_FONTS = new Set(['Padrão institucional', 'Arial', 'Georgia', 'Verdana', 'Trebuchet MS', 'Times New Roman', 'Courier New', 'Tahoma']);

  const nowStamp = () => new Date().toISOString().slice(0, 19).replace('T', ' ');
  const bytesToHex = (bytes) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const hexToBytes = (hex) => new Uint8Array((hex.match(/.{1,2}/g) || []).map((h) => parseInt(h, 16)));

  async function passwordHash(password, saltHex) {
    const salt = saltHex ? hexToBytes(saltHex) : crypto.getRandomValues(new Uint8Array(16));
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 210000 }, keyMaterial, 256);
    return `${bytesToHex(salt)}:${bytesToHex(new Uint8Array(bits))}`;
  }

  async function passwordOk(password, stored) {
    try {
      const [saltHex, expected] = String(stored || '').split(':');
      if (!saltHex || !expected) return false;
      const actual = (await passwordHash(password, saltHex)).split(':')[1];
      return actual === expected;
    } catch {
      return false;
    }
  }

  function cleanCpf(value) {
    return String(value || '').replace(/\D/g, '');
  }

  function safeUrl(value) {
    const v = String(value || '').trim();
    return /^(#|\/|https?:\/\/)/.test(v) ? v : null;
  }

  function resolveBanner(value) {
    const base = String(value || '').split(/[\\/]/).pop() || '';
    const dot = base.lastIndexOf('.');
    const stem = (dot > 0 ? base.slice(0, dot) : base).trim().toLowerCase();
    if (!stem) return '';
    const matches = BANNER_FILES
      .filter((name) => {
        const d = name.lastIndexOf('.');
        const ext = d >= 0 ? name.slice(d).toLowerCase() : '';
        const fileStem = (d > 0 ? name.slice(0, d) : name).toLowerCase();
        return BANNER_EXTENSIONS.has(ext) && fileStem === stem;
      })
      .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
    return matches[0] || '';
  }

  function profileValues(data) {
    const keys = ['name', 'logo', 'page_title', 'color_primary', 'color_secondary', 'color_detail', 'font_family'];
    const values = {};
    keys.forEach((k) => { values[k] = String(data[k] ?? '').trim(); });
    if (!values.font_family) values.font_family = 'Padrão institucional';
    if (!keys.every((k) => values[k]) || !PROFILE_FONTS.has(values.font_family)) {
      throw new ApiError(400, 'Perfil visual inválido.');
    }
    return values;
  }

  class ApiError extends Error {
    constructor(status, message) { super(message); this.status = status; }
  }

  function loadDb() {
    try {
      const raw = localStorage.getItem(DB_KEY);
      if (raw) return JSON.parse(raw);
    } catch { /* localStorage indisponível ou dado corrompido: resemeia abaixo */ }
    return seedDb();
  }

  function saveDb(db) {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  }

  function seedDb() {
    const db = {
      seq: { users: 1, access_requests: 0, header_profiles: 1, menu_items: 4, notices: 0, pending_changes: 0 },
      users: [{
        id: 1, name: 'Administrador Master', cpf: '00000000000', email: 'master@ssp.gov.br',
        role: 'master', password_hash: null, active: true, created_at: nowStamp(),
      }],
      access_requests: [],
      header_profiles: [{
        id: 1, name: 'Paleta Padrão', logo: 'logo-ssp.svg', page_title: 'Intranet SSP',
        color_primary: '#0B2D48', color_secondary: '#19577F', color_detail: '#D7A62A',
        font_family: 'Padrão institucional', active: true, created_at: nowStamp(),
      }],
      change_control: { locked: false, note: '', carousel_enabled: true, notices_page_blocked: false, updated_at: nowStamp() },
      pending_changes: [],
      menu_items: [
        { id: 1, title: 'Polícia Civil', description: 'Investigação, polícia judiciária e atendimento ao cidadão.', url: '#civil', active: true, display_order: 1, created_at: nowStamp() },
        { id: 2, title: 'Polícia Militar', description: 'Policiamento ostensivo e preservação da ordem pública.', url: '#militar', active: true, display_order: 2, created_at: nowStamp() },
        { id: 3, title: 'Polícia Científica', description: 'Perícia oficial e produção de conhecimento técnico-científico.', url: '#cientifica', active: true, display_order: 3, created_at: nowStamp() },
        { id: 4, title: 'Conseg', description: 'Participação comunitária e integração com a segurança pública.', url: '#conseg', active: true, display_order: 4, created_at: nowStamp() },
      ],
      notices: [],
    };
    saveDb(db);
    // Hash da senha de demonstração é gerado de forma assíncrona (Web Crypto); grava assim que pronto.
    passwordHash('Master@123').then((hash) => {
      const fresh = loadDb();
      const master = fresh.users.find((u) => u.id === 1);
      if (master) { master.password_hash = hash; saveDb(fresh); }
    });
    return db;
  }

  function nextId(db, table) {
    db.seq[table] = (db.seq[table] || 0) + 1;
    return db.seq[table];
  }

  function reorder(list, ids) {
    const numericIds = ids.map(Number);
    const existing = list.map((item) => item.id);
    if (numericIds.length !== existing.length || new Set(numericIds).size !== new Set(existing).size
      || !numericIds.every((id) => existing.includes(id))) {
      throw new ApiError(409, 'A lista de ordenação está desatualizada.');
    }
    numericIds.forEach((id, index) => {
      const item = list.find((i) => i.id === id);
      item.display_order = index + 1;
    });
  }

  function insertNoticeFirst(db, values) {
    db.notices.forEach((n) => { n.display_order += 1; });
    db.notices.push({
      id: nextId(db, 'notices'), display_order: 1, created_at: nowStamp(),
      title: values.title, description: values.description, banner_file: values.banner_file || '',
      button_name: values.button_name || '', button_url: values.button_url || '',
      active: !!values.active, active_carousel: !!values.active_carousel,
    });
  }

  function userPublic(u) {
    return { id: u.id, name: u.name, cpf: u.cpf, email: u.email, role: u.role, active: !!u.active, created_at: u.created_at };
  }

  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);
      if (session.expires > Date.now()) return session;
      localStorage.removeItem(SESSION_KEY);
      return null;
    } catch { return null; }
  }

  function setSession(user) {
    const session = { ...userPublic(user), expires: Date.now() + SESSION_HOURS * 3600 * 1000 };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  function requireAuth() {
    const session = getSession();
    if (!session) throw new ApiError(401, 'Sessão expirada.');
    return session;
  }

  function requireMaster() {
    const session = requireAuth();
    if (session.role !== 'master') throw new ApiError(403, 'Ação exclusiva do Administrador Master.');
    return session;
  }

  function queueIfRequired(db, session, action, entity, entityId, payload) {
    if (session.role === 'master') return false;
    if (!db.change_control.locked) return false;
    db.pending_changes.push({
      id: nextId(db, 'pending_changes'), action, entity, entity_id: entityId ?? null,
      payload: JSON.stringify(payload), requested_by: session.id, requester_name: session.name,
      status: 'pending', created_at: nowStamp(), reviewed_by: null, reviewed_at: null,
    });
    return true;
  }

  function parseId(path) {
    const id = Number(path.split('/').pop());
    if (!Number.isInteger(id)) throw new ApiError(400, 'Identificador inválido.');
    return id;
  }

  async function handleApi(method, path, data) {
    const db = loadDb();
    const result = await route(db, method, path, data || {});
    saveDb(db);
    return result;
  }

  async function route(db, method, path, data) {
    // ---- GET ----
    if (method === 'GET' && path === '/api/health') return [200, { status: 'ok', application: 'Intranet SSP' }];

    if (method === 'GET' && path === '/api/session') {
      const session = getSession();
      return session ? [200, { user: session }] : [401, { error: 'Não autenticado.' }];
    }

    if (method === 'GET' && path === '/api/theme') {
      const profile = db.header_profiles.find((p) => p.active) || null;
      return [200, { profile }];
    }

    if (method === 'GET' && path === '/api/site-settings') {
      const c = db.change_control;
      return [200, { settings: { carousel_enabled: !!c.carousel_enabled, notices_page_blocked: !!c.notices_page_blocked } }];
    }

    if (method === 'GET' && path === '/api/menu') {
      const authenticated = !!getSession();
      const items = db.menu_items
        .filter((i) => authenticated || i.active)
        .slice()
        .sort((a, b) => a.display_order - b.display_order || a.id - b.id);
      return [200, { items }];
    }

    if (method === 'GET' && path === '/api/notices') {
      const authenticated = !!getSession();
      const notices = db.notices
        .filter((n) => authenticated || n.active)
        .slice()
        .sort((a, b) => a.display_order - b.display_order || a.id - b.id)
        .map((n) => ({ ...n, banner_resolved: resolveBanner(n.banner_file) }));
      return [200, { notices }];
    }

    if (method === 'GET' && path === '/api/users') {
      requireMaster();
      const users = db.users.slice().sort((a, b) => a.name.localeCompare(b.name)).map(userPublic);
      return [200, { users }];
    }

    if (method === 'GET' && path === '/api/requests') {
      requireMaster();
      const requests = db.access_requests.slice().sort((a, b) => b.id - a.id);
      return [200, { requests }];
    }

    if (method === 'GET' && path === '/api/profiles') {
      requireAuth();
      const profiles = db.header_profiles.slice().sort((a, b) => a.id - b.id);
      return [200, { profiles }];
    }

    if (method === 'GET' && path === '/api/change-control') {
      requireAuth();
      const control = { ...db.change_control, pending_count: db.pending_changes.filter((c) => c.status === 'pending').length };
      return [200, { control }];
    }

    if (method === 'GET' && path === '/api/pending-changes') {
      requireMaster();
      const changes = db.pending_changes.filter((c) => c.status === 'pending').slice().sort((a, b) => b.id - a.id);
      return [200, { changes }];
    }

    // ---- POST ----
    if (method === 'POST' && path === '/api/login') {
      const cpf = cleanCpf(data.cpf);
      const user = db.users.find((u) => u.cpf === cpf && u.active);
      if (!user || !user.password_hash || !(await passwordOk(String(data.password || ''), user.password_hash))) {
        return [401, { error: 'CPF ou senha inválidos.' }];
      }
      return [200, { user: setSession(user) }];
    }

    if (method === 'POST' && path === '/api/logout') {
      clearSession();
      return [200, { message: 'Sessão encerrada.' }];
    }

    if (method === 'POST' && path === '/api/access-requests') {
      const required = ['name', 'cpf', 'email', 'unit'];
      if (required.some((k) => !String(data[k] || '').trim())) return [400, { error: 'Preencha todos os campos.' }];
      db.access_requests.push({
        id: nextId(db, 'access_requests'), name: data.name.trim(), cpf: cleanCpf(data.cpf),
        email: data.email.trim(), unit: data.unit.trim(), status: 'pending', created_at: nowStamp(),
      });
      return [201, { message: 'Solicitação enviada com sucesso.' }];
    }

    if (method === 'POST' && path === '/api/users') {
      requireMaster();
      if (String(data.password || '').length < 8) return [400, { error: 'A senha deve possuir ao menos 8 caracteres.' }];
      const cpf = cleanCpf(data.cpf), email = String(data.email || '').trim();
      if (db.users.some((u) => u.cpf === cpf || u.email === email)) return [409, { error: 'CPF ou e-mail já cadastrado.' }];
      db.users.push({
        id: nextId(db, 'users'), name: String(data.name || '').trim(), cpf, email,
        role: data.role || 'site', password_hash: await passwordHash(data.password), active: true, created_at: nowStamp(),
      });
      return [201, { message: 'Administrador cadastrado.' }];
    }

    if (method === 'POST' && path === '/api/profiles') {
      const session = requireAuth();
      if (queueIfRequired(db, session, 'create', 'header_profile', null, data)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      if (db.header_profiles.length >= 5) return [409, { error: 'O limite de 5 perfis foi atingido.' }];
      const values = profileValues(data);
      if (db.header_profiles.some((p) => p.name === values.name)) return [409, { error: 'Nome inválido ou já utilizado.' }];
      db.header_profiles.push({ id: nextId(db, 'header_profiles'), ...values, active: false, created_at: nowStamp() });
      return [201, { message: 'Perfil criado.' }];
    }

    if (method === 'POST' && path === '/api/menu') {
      const session = requireAuth();
      if (!safeUrl(data.url)) return [400, { error: 'Use uma URL iniciada por https://, http://, / ou #.' }];
      if (queueIfRequired(db, session, 'create', 'menu_item', null, data)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      const order = Number(data.display_order ?? 1);
      if (db.menu_items.some((i) => i.display_order === order)) return [409, { error: 'Já existe um item nesta ordem. Escolha outra posição ou use a ordenação por arrastar.' }];
      db.menu_items.push({
        id: nextId(db, 'menu_items'), title: String(data.title || '').trim(), description: String(data.description || '').trim(),
        url: data.url.trim(), active: true, display_order: order, created_at: nowStamp(),
      });
      return [201, { message: 'Item de menu incluído.' }];
    }

    if (method === 'POST' && path === '/api/notices') {
      const session = requireAuth();
      const title = String(data.title || '').trim(), description = String(data.description || '').trim();
      const buttonName = String(data.button_name || '').trim(), buttonUrl = String(data.button_url || '').trim();
      if (!title || !description) return [400, { error: 'Título e descrição são obrigatórios.' }];
      if (buttonName && !safeUrl(buttonUrl)) return [400, { error: 'Informe uma URL válida quando houver nome do botão.' }];
      if (queueIfRequired(db, session, 'create', 'notice', null, data)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      insertNoticeFirst(db, { title, description, banner_file: String(data.banner_file || '').trim(), button_name: buttonName, button_url: buttonUrl, active: data.active, active_carousel: data.active_carousel });
      return [201, { message: 'Aviso incluído.' }];
    }

    // ---- PUT ----
    if (method === 'PUT' && path.startsWith('/api/users/')) {
      requireMaster();
      const id = parseId(path);
      const user = db.users.find((u) => u.id === id);
      if (!user) return [404, { error: 'Administrador não encontrado.' }];
      const cpf = cleanCpf(data.cpf), email = String(data.email || '').trim();
      if (db.users.some((u) => u.id !== id && (u.cpf === cpf || u.email === email))) return [409, { error: 'CPF ou e-mail já cadastrado.' }];
      if (data.password) {
        if (String(data.password).length < 8) return [400, { error: 'A senha deve possuir ao menos 8 caracteres.' }];
        user.password_hash = await passwordHash(data.password);
      }
      Object.assign(user, { name: String(data.name || '').trim(), cpf, email, role: data.role, active: data.active !== undefined ? !!data.active : true });
      return [200, { message: 'Administrador atualizado.' }];
    }

    if (method === 'PUT' && path.startsWith('/api/profiles/')) {
      const session = requireAuth();
      const id = parseId(path);
      const action = data.activate ? 'activate' : 'update';
      if (queueIfRequired(db, session, action, 'header_profile', id, data)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      if (data.activate) {
        db.header_profiles.forEach((p) => { p.active = false; });
        const profile = db.header_profiles.find((p) => p.id === id);
        if (profile) profile.active = true;
      } else {
        const values = profileValues(data);
        if (db.header_profiles.some((p) => p.id !== id && p.name === values.name)) return [409, { error: 'Nome já utilizado.' }];
        Object.assign(db.header_profiles.find((p) => p.id === id) || {}, values);
      }
      return [200, { message: 'Perfil atualizado.' }];
    }

    if (method === 'PUT' && path === '/api/menu/reorder') {
      const session = requireAuth();
      if (queueIfRequired(db, session, 'reorder', 'menu_item', null, data)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      reorder(db.menu_items, data.ids || []);
      return [200, { message: 'Ordem do menu atualizada.' }];
    }

    if (method === 'PUT' && path.startsWith('/api/menu/') && 'active' in data && !('title' in data)) {
      const session = requireAuth();
      const id = parseId(path);
      const payload = { active: !!data.active };
      if (queueIfRequired(db, session, 'status', 'menu_item', id, payload)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      const item = db.menu_items.find((i) => i.id === id);
      if (item) item.active = payload.active;
      return [200, { message: payload.active ? 'Item de menu ativado.' : 'Item de menu inativado.' }];
    }

    if (method === 'PUT' && path.startsWith('/api/menu/')) {
      const session = requireAuth();
      if (!safeUrl(data.url)) return [400, { error: 'Use uma URL iniciada por https://, http://, / ou #.' }];
      const id = parseId(path);
      if (queueIfRequired(db, session, 'update', 'menu_item', id, data)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      const order = Number(data.display_order ?? 1);
      if (db.menu_items.some((i) => i.id !== id && i.display_order === order)) return [409, { error: 'Já existe um item nesta ordem. Escolha outra posição ou use a ordenação por arrastar.' }];
      const item = db.menu_items.find((i) => i.id === id);
      if (item) Object.assign(item, { title: String(data.title || '').trim(), description: String(data.description || '').trim(), url: data.url.trim(), display_order: order });
      return [200, { message: 'Item de menu atualizado.' }];
    }

    if (method === 'PUT' && path === '/api/notices/bulk-status') {
      const session = requireAuth();
      const ids = (data.ids || []).map(Number);
      if (!ids.length) return [400, { error: 'Selecione ao menos um aviso.' }];
      const payload = { ids, active: !!data.active };
      if (queueIfRequired(db, session, 'bulk_status', 'notice', null, payload)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      db.notices.filter((n) => ids.includes(n.id)).forEach((n) => { n.active = payload.active; });
      return [200, { message: `${ids.length} aviso(s) ${payload.active ? 'ativado(s)' : 'inativado(s)'}.` }];
    }

    if (method === 'PUT' && path === '/api/notices/bulk-carousel') {
      const session = requireAuth();
      const ids = (data.ids || []).map(Number);
      if (!ids.length) return [400, { error: 'Selecione ao menos um aviso.' }];
      const payload = { ids, active_carousel: !!data.active_carousel };
      if (queueIfRequired(db, session, 'bulk_carousel', 'notice', null, payload)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      db.notices.filter((n) => ids.includes(n.id)).forEach((n) => { n.active_carousel = payload.active_carousel; });
      return [200, { message: `${ids.length} aviso(s) ${payload.active_carousel ? 'adicionado(s) ao' : 'removido(s) do'} carrossel.` }];
    }

    if (method === 'PUT' && path === '/api/notices/reorder') {
      const session = requireAuth();
      if (queueIfRequired(db, session, 'reorder', 'notice', null, data)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      reorder(db.notices, data.ids || []);
      return [200, { message: 'Ordem dos avisos atualizada.' }];
    }

    if (method === 'PUT' && path.startsWith('/api/notices/')) {
      const session = requireAuth();
      const id = parseId(path);
      const title = String(data.title || '').trim(), description = String(data.description || '').trim();
      const buttonName = String(data.button_name || '').trim(), buttonUrl = String(data.button_url || '').trim();
      if (!title || !description) return [400, { error: 'Título e descrição são obrigatórios.' }];
      if (buttonName && !safeUrl(buttonUrl)) return [400, { error: 'Informe uma URL válida quando houver nome do botão.' }];
      if (queueIfRequired(db, session, 'update', 'notice', id, data)) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      const notice = db.notices.find((n) => n.id === id);
      if (notice) Object.assign(notice, { title, description, banner_file: String(data.banner_file || '').trim(), button_name: buttonName, button_url: buttonUrl, active: !!data.active, active_carousel: !!data.active_carousel, display_order: Number(data.display_order ?? notice.display_order) });
      return [200, { message: 'Aviso atualizado.' }];
    }

    if (method === 'PUT' && path === '/api/change-control') {
      requireMaster();
      const locked = !!data.locked;
      const pending = db.pending_changes.filter((c) => c.status === 'pending').length;
      if (!locked && pending) return [409, { error: `Existem ${pending} alterações pendentes. Valide-as antes de desmarcar o bloqueio.`, pending_count: pending }];
      Object.assign(db.change_control, { locked, note: '', carousel_enabled: !locked, updated_at: nowStamp() });
      if (locked) db.notices.forEach((n) => { n.active = false; n.active_carousel = false; });
      return [200, { message: 'Controle de alterações atualizado.' }];
    }

    if (method === 'PUT' && path === '/api/site-settings') {
      requireMaster();
      const allowed = new Set(['carousel_enabled', 'notices_page_blocked']);
      const setting = String(data.setting || '');
      if (!allowed.has(setting)) return [400, { error: 'Configuração inválida.' }];
      db.change_control[setting] = !!data.value;
      db.change_control.updated_at = nowStamp();
      return [200, { message: 'Configuração atualizada.' }];
    }

    if (method === 'PUT' && path.startsWith('/api/pending-changes/')) {
      const session = requireMaster();
      const changeId = parseId(path);
      const decision = data.decision;
      if (!['approved', 'rejected'].includes(decision)) return [400, { error: 'Decisão inválida.' }];
      const row = db.pending_changes.find((c) => c.id === changeId && c.status === 'pending');
      if (!row) return [404, { error: 'Alteração pendente não encontrada.' }];
      if (decision === 'approved') {
        try {
          applyPendingChange(db, row);
        } catch {
          return [409, { error: 'A alteração não pode mais ser aplicada; atualize a fila e verifique ordens ou dados duplicados.' }];
        }
      }
      row.status = decision; row.reviewed_by = session.id; row.reviewed_at = nowStamp();
      return [200, { message: decision === 'approved' ? 'Alteração aprovada e aplicada.' : 'Alteração recusada.' }];
    }

    if (method === 'PUT' && path.startsWith('/api/requests/')) {
      requireMaster();
      const id = parseId(path);
      const status = data.status;
      if (!['approved', 'rejected'].includes(status)) return [400, { error: 'Status inválido.' }];
      const row = db.access_requests.find((r) => r.id === id);
      if (!row) return [404, { error: 'Solicitação não encontrada.' }];
      row.status = status;
      if (status === 'approved' && !db.users.some((u) => u.cpf === row.cpf)) {
        const temp = Math.random().toString(36).slice(2, 11) + Math.random().toString(36).slice(2, 11);
        db.users.push({ id: nextId(db, 'users'), name: row.name, cpf: row.cpf, email: row.email, role: 'site', password_hash: await passwordHash(temp), active: true, created_at: nowStamp() });
        return [200, { message: 'Acesso aprovado.', temporary_password: temp }];
      }
      return [200, { message: 'Solicitação atualizada.' }];
    }

    // ---- DELETE ----
    if (method === 'DELETE') {
      const session = requireAuth();
      const id = parseId(path);
      if (path.startsWith('/api/users/') && session.role !== 'master') return [403, { error: 'Ação exclusiva do Administrador Master.' }];
      if (path.startsWith('/api/profiles/') && queueIfRequired(db, session, 'delete', 'header_profile', id, {})) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      if (path.startsWith('/api/menu/') && queueIfRequired(db, session, 'delete', 'menu_item', id, {})) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];
      if (path.startsWith('/api/notices/') && queueIfRequired(db, session, 'delete', 'notice', id, {})) return [202, { message: 'Alteração enviada para validação do Administrador Master.', pending: true }];

      if (path.startsWith('/api/users/')) {
        if (id === session.id) return [409, { error: 'Você não pode excluir o próprio usuário.' }];
        db.users = db.users.filter((u) => u.id !== id);
      } else if (path.startsWith('/api/profiles/')) {
        const profile = db.header_profiles.find((p) => p.id === id);
        if (!profile) return [404, { error: 'Perfil não encontrado.' }];
        if (profile.active) return [409, { error: 'O perfil em uso não pode ser excluído.' }];
        if (profile.name === 'Paleta Padrão') return [409, { error: 'A Paleta Padrão não pode ser excluída.' }];
        db.header_profiles = db.header_profiles.filter((p) => p.id !== id);
      } else if (path.startsWith('/api/menu/')) {
        db.menu_items = db.menu_items.filter((i) => i.id !== id);
      } else if (path.startsWith('/api/notices/')) {
        db.notices = db.notices.filter((n) => n.id !== id);
      } else {
        return [404, { error: 'Rota não encontrada.' }];
      }
      return [200, { message: 'Registro excluído.' }];
    }

    return [404, { error: 'Rota não encontrada.' }];
  }

  function applyPendingChange(db, row) {
    const payload = JSON.parse(row.payload);
    const pid = row.entity_id;
    if (row.entity === 'notice') {
      if (row.action === 'bulk_status') {
        const ids = (payload.ids || []).map(Number);
        if (!ids.length) throw new Error('Seleção vazia');
        db.notices.filter((n) => ids.includes(n.id)).forEach((n) => { n.active = !!payload.active; });
      } else if (row.action === 'bulk_carousel') {
        const ids = (payload.ids || []).map(Number);
        if (!ids.length) throw new Error('Seleção vazia');
        db.notices.filter((n) => ids.includes(n.id)).forEach((n) => { n.active_carousel = !!payload.active_carousel; });
      } else if (row.action === 'reorder') reorder(db.notices, payload.ids || []);
      else if (row.action === 'create') insertNoticeFirst(db, { title: String(payload.title).trim(), description: String(payload.description).trim(), banner_file: String(payload.banner_file || '').trim(), button_name: String(payload.button_name || '').trim(), button_url: String(payload.button_url || '').trim(), active: payload.active, active_carousel: payload.active_carousel });
      else if (row.action === 'update') {
        const notice = db.notices.find((n) => n.id === pid);
        if (notice) Object.assign(notice, { title: String(payload.title).trim(), description: String(payload.description).trim(), banner_file: String(payload.banner_file || '').trim(), button_name: String(payload.button_name || '').trim(), button_url: String(payload.button_url || '').trim(), active: !!payload.active, active_carousel: !!payload.active_carousel, display_order: Number(payload.display_order ?? notice.display_order) });
      } else if (row.action === 'delete') db.notices = db.notices.filter((n) => n.id !== pid);
    } else if (row.entity === 'menu_item') {
      if (row.action === 'reorder') reorder(db.menu_items, payload.ids || []);
      else if (row.action === 'create') db.menu_items.push({ id: nextId(db, 'menu_items'), title: String(payload.title).trim(), description: String(payload.description || '').trim(), url: payload.url.trim(), active: true, display_order: Number(payload.display_order ?? 1), created_at: nowStamp() });
      else if (row.action === 'update') {
        const item = db.menu_items.find((i) => i.id === pid);
        if (item) Object.assign(item, { title: String(payload.title).trim(), description: String(payload.description || '').trim(), url: payload.url.trim(), display_order: Number(payload.display_order ?? item.display_order) });
      } else if (row.action === 'status') {
        const item = db.menu_items.find((i) => i.id === pid);
        if (item) item.active = !!payload.active;
      } else if (row.action === 'delete') db.menu_items = db.menu_items.filter((i) => i.id !== pid);
    } else if (row.action === 'create') {
      if (db.header_profiles.length >= 5) throw new Error('Limite de perfis atingido.');
      const values = profileValues(payload);
      db.header_profiles.push({ id: nextId(db, 'header_profiles'), ...values, active: false, created_at: nowStamp() });
    } else if (row.action === 'update') {
      const values = profileValues(payload);
      Object.assign(db.header_profiles.find((p) => p.id === pid) || {}, values);
    } else if (row.action === 'activate') {
      db.header_profiles.forEach((p) => { p.active = false; });
      const profile = db.header_profiles.find((p) => p.id === pid);
      if (profile) profile.active = true;
    } else if (row.action === 'delete') {
      db.header_profiles = db.header_profiles.filter((p) => !(p.id === pid && !p.active && p.name !== 'Paleta Padrão'));
    }
  }

  // Restaura os dados de demonstração para o estado inicial (apaga localStorage e recarrega).
  window.sspResetDemoData = () => {
    localStorage.removeItem(DB_KEY);
    localStorage.removeItem(SESSION_KEY);
    location.reload();
  };

  const realFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const rawUrl = typeof input === 'string' ? input : input.url;
    const path = rawUrl.replace(/^[a-z]+:\/\/[^/]+/i, '');
    if (!path.startsWith('/api/')) return realFetch(input, init);
    try {
      const method = (init.method || 'GET').toUpperCase();
      const body = init.body ? JSON.parse(init.body) : {};
      const [status, payload] = await handleApi(method, path, body);
      return new Response(JSON.stringify(payload), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    } catch (error) {
      const status = error instanceof ApiError ? error.status : 500;
      const message = error instanceof ApiError ? error.message : 'Erro inesperado no protótipo.';
      return new Response(JSON.stringify({ error: message }), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } });
    }
  };
})();
