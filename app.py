"""Servidor da Intranet SSP: arquivos estáticos, autenticação e persistência SQLite."""
from __future__ import annotations

import hashlib
import hmac
import json
import mimetypes
import os
import secrets
import sqlite3
import time
from http import cookies
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parent
DB_PATH = ROOT / "data" / "intranet.db"
SESSIONS: dict[str, dict] = {}


def db():
    connection = sqlite3.connect(DB_PATH)
    connection.row_factory = sqlite3.Row
    connection.execute("PRAGMA foreign_keys=ON")
    return connection


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, 210_000)
    return f"{salt.hex()}:{digest.hex()}"


def password_ok(password: str, stored: str) -> bool:
    try:
        salt, expected = stored.split(":", 1)
        actual = password_hash(password, bytes.fromhex(salt)).split(":", 1)[1]
        return hmac.compare_digest(actual, expected)
    except (ValueError, AttributeError):
        return False


PROFILE_FONTS = {"Padrão institucional", "Arial", "Georgia", "Verdana", "Trebuchet MS", "Times New Roman", "Courier New", "Tahoma"}


def profile_values(data):
    keys = ("name", "logo", "page_title", "color_primary", "color_secondary", "color_detail", "font_family")
    values = tuple(str(data[k]).strip() for k in keys)
    if not all(values) or values[-1] not in PROFILE_FONTS:
        raise sqlite3.IntegrityError("Perfil visual inválido")
    return values


def initialize():
    DB_PATH.parent.mkdir(exist_ok=True)
    with db() as conn:
        conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
          cpf TEXT NOT NULL UNIQUE, email TEXT NOT NULL UNIQUE,
          role TEXT NOT NULL CHECK(role IN ('master','site')),
          password_hash TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS access_requests (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, cpf TEXT NOT NULL,
          email TEXT NOT NULL, unit TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS header_profiles (
          id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL UNIQUE,
          logo TEXT NOT NULL, page_title TEXT NOT NULL,
          color_primary TEXT NOT NULL, color_secondary TEXT NOT NULL, color_detail TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS change_control (
          id INTEGER PRIMARY KEY CHECK(id=1), locked INTEGER NOT NULL DEFAULT 0,
          note TEXT NOT NULL DEFAULT '', carousel_enabled INTEGER NOT NULL DEFAULT 1,
          notices_page_blocked INTEGER NOT NULL DEFAULT 0,
          updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS pending_changes (
          id INTEGER PRIMARY KEY AUTOINCREMENT, action TEXT NOT NULL,
          entity TEXT NOT NULL, entity_id INTEGER, payload TEXT NOT NULL,
          requested_by INTEGER NOT NULL, requester_name TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
          reviewed_by INTEGER, reviewed_at TEXT
        );
        CREATE TABLE IF NOT EXISTS menu_items (
          id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
          description TEXT NOT NULL, url TEXT NOT NULL,
          active INTEGER NOT NULL DEFAULT 1,
          display_order INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS notices (
          id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL,
          description TEXT NOT NULL, banner_file TEXT NOT NULL DEFAULT '',
          button_name TEXT NOT NULL DEFAULT '', button_url TEXT NOT NULL DEFAULT '',
          active INTEGER NOT NULL DEFAULT 0, active_carousel INTEGER NOT NULL DEFAULT 0,
          display_order INTEGER NOT NULL DEFAULT 1,
          created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
        """)
        if not conn.execute("SELECT 1 FROM users LIMIT 1").fetchone():
            conn.execute("INSERT INTO users(name,cpf,email,role,password_hash) VALUES(?,?,?,?,?)",
                         ("Administrador Master", "00000000000", "master@ssp.gov.br", "master", password_hash("Master@123")))
        if not conn.execute("SELECT 1 FROM header_profiles LIMIT 1").fetchone():
            conn.execute("""INSERT INTO header_profiles
              (name,logo,page_title,color_primary,color_secondary,color_detail,active)
              VALUES(?,?,?,?,?,?,1)""", ("Paleta Padrão", "logo-ssp.svg", "Intranet SSP", "#0B2D48", "#19577F", "#D7A62A"))
        profile_columns={row[1] for row in conn.execute("PRAGMA table_info(header_profiles)").fetchall()}
        if "font_family" not in profile_columns:conn.execute("ALTER TABLE header_profiles ADD COLUMN font_family TEXT NOT NULL DEFAULT 'Padrão institucional'")
        conn.execute("INSERT OR IGNORE INTO change_control(id,locked,note) VALUES(1,0,'')")
        control_columns={row[1] for row in conn.execute("PRAGMA table_info(change_control)").fetchall()}
        if "carousel_enabled" not in control_columns:conn.execute("ALTER TABLE change_control ADD COLUMN carousel_enabled INTEGER NOT NULL DEFAULT 1")
        if "notices_page_blocked" not in control_columns:conn.execute("ALTER TABLE change_control ADD COLUMN notices_page_blocked INTEGER NOT NULL DEFAULT 0")
        menu_columns={row[1] for row in conn.execute("PRAGMA table_info(menu_items)").fetchall()}
        if "active" not in menu_columns:conn.execute("ALTER TABLE menu_items ADD COLUMN active INTEGER NOT NULL DEFAULT 1")
        if not conn.execute("SELECT 1 FROM menu_items LIMIT 1").fetchone():
            conn.executemany("INSERT INTO menu_items(title,description,url,display_order) VALUES(?,?,?,?)",[
              ("Polícia Civil","Investigação, polícia judiciária e atendimento ao cidadão.","#civil",1),
              ("Polícia Militar","Policiamento ostensivo e preservação da ordem pública.","#militar",2),
              ("Polícia Científica","Perícia oficial e produção de conhecimento técnico-científico.","#cientifica",3),
              ("Conseg","Participação comunitária e integração com a segurança pública.","#conseg",4)])
        ordered=conn.execute("SELECT id FROM menu_items ORDER BY display_order,id").fetchall()
        for position,row in enumerate(ordered,1):conn.execute("UPDATE menu_items SET display_order=? WHERE id=?",(-position,row["id"]))
        for position,row in enumerate(ordered,1):conn.execute("UPDATE menu_items SET display_order=? WHERE id=?",(position,row["id"]))
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_menu_display_order ON menu_items(display_order)")
        ordered_notices=conn.execute("SELECT id FROM notices ORDER BY display_order,id").fetchall()
        for position,row in enumerate(ordered_notices,1):conn.execute("UPDATE notices SET display_order=? WHERE id=?",(-position,row["id"]))
        for position,row in enumerate(ordered_notices,1):conn.execute("UPDATE notices SET display_order=? WHERE id=?",(position,row["id"]))
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_notice_display_order ON notices(display_order)")


def clean_cpf(value):
    return "".join(c for c in str(value or "") if c.isdigit())


def safe_url(value):
    value=str(value or "").strip()
    return value if value.startswith(("#","/","http://","https://")) else None


def resolve_banner(value):
    """Resolve pelo nome-base, ignorando a extensão informada pelo administrador."""
    stem=Path(Path(str(value or "")).name).stem.strip().lower()
    if not stem:return ""
    folder=ROOT/"images_banner"
    allowed={".png",".jpg",".jpeg",".webp",".gif",".svg",".avif"}
    matches=sorted((p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in allowed and p.stem.lower()==stem),key=lambda p:p.name.lower()) if folder.exists() else []
    return matches[0].name if matches else ""


def reorder_menu(conn, item_ids):
    ids=[int(value) for value in item_ids]
    existing=[row[0] for row in conn.execute("SELECT id FROM menu_items").fetchall()]
    if len(ids)!=len(existing) or set(ids)!=set(existing):raise ValueError("A lista de ordenação está desatualizada.")
    for position,item_id in enumerate(ids,1):conn.execute("UPDATE menu_items SET display_order=? WHERE id=?",(-position,item_id))
    for position,item_id in enumerate(ids,1):conn.execute("UPDATE menu_items SET display_order=? WHERE id=?",(position,item_id))


def reorder_notices(conn, item_ids):
    ids=[int(value) for value in item_ids]
    existing=[row[0] for row in conn.execute("SELECT id FROM notices").fetchall()]
    if len(ids)!=len(existing) or set(ids)!=set(existing):raise ValueError("A lista de ordenação está desatualizada.")
    for position,item_id in enumerate(ids,1):conn.execute("UPDATE notices SET display_order=? WHERE id=?",(-position,item_id))
    for position,item_id in enumerate(ids,1):conn.execute("UPDATE notices SET display_order=? WHERE id=?",(position,item_id))


def insert_notice_first(conn, values):
    existing=conn.execute("SELECT id FROM notices ORDER BY display_order,id").fetchall()
    for position,row in enumerate(existing,1):conn.execute("UPDATE notices SET display_order=? WHERE id=?",(-position,row["id"]))
    for position,row in enumerate(existing,2):conn.execute("UPDATE notices SET display_order=? WHERE id=?",(position,row["id"]))
    conn.execute("""INSERT INTO notices(title,description,banner_file,button_name,button_url,active,active_carousel,display_order)
      VALUES(?,?,?,?,?,?,?,1)""",values)


def user_public(row):
    return {"id": row["id"], "name": row["name"], "cpf": row["cpf"], "email": row["email"],
            "role": row["role"], "active": bool(row["active"]), "created_at": row["created_at"]}


class Handler(BaseHTTPRequestHandler):
    server_version = "IntranetSSP/1.0"

    def log_message(self, fmt, *args):
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def json_body(self):
        try:
            size = int(self.headers.get("Content-Length", "0"))
            return json.loads(self.rfile.read(size) or b"{}")
        except (ValueError, json.JSONDecodeError):
            return {}

    def send_json(self, status, payload, headers=None):
        body = json.dumps(payload, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (headers or {}).items(): self.send_header(key, value)
        self.end_headers(); self.wfile.write(body)

    def session(self):
        jar = cookies.SimpleCookie(self.headers.get("Cookie"))
        token = jar.get("ssp_session")
        session = SESSIONS.get(token.value) if token else None
        if session and session["expires"] > time.time(): return session
        return None

    def require_master(self):
        session = self.session()
        if not session: self.send_json(401, {"error": "Sessão expirada."}); return None
        if session["role"] != "master": self.send_json(403, {"error": "Ação exclusiva do Administrador Master."}); return None
        return session

    def require_auth(self):
        session = self.session()
        if not session: self.send_json(401, {"error": "Sessão expirada."}); return None
        return session

    def queue_if_required(self, session, action, entity, entity_id, payload):
        if session["role"] == "master": return False
        with db() as conn:
            locked = conn.execute("SELECT locked FROM change_control WHERE id=1").fetchone()[0]
            if not locked: return False
            conn.execute("""INSERT INTO pending_changes(action,entity,entity_id,payload,requested_by,requester_name)
              VALUES(?,?,?,?,?,?)""", (action,entity,entity_id,json.dumps(payload,ensure_ascii=False),session["id"],session["name"]))
        self.send_json(202,{"message":"Alteração enviada para validação do Administrador Master.","pending":True})
        return True

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            return self.send_json(200,{"status":"ok","application":"Intranet SSP"})
        if path == "/api/session":
            session = self.session(); return self.send_json(200 if session else 401, {"user": session} if session else {"error": "Não autenticado."})
        if path == "/api/theme":
            with db() as conn: row = conn.execute("SELECT * FROM header_profiles WHERE active=1 LIMIT 1").fetchone()
            return self.send_json(200, {"profile": dict(row) if row else None})
        if path == "/api/site-settings":
            with db() as conn:row=conn.execute("SELECT carousel_enabled,notices_page_blocked FROM change_control WHERE id=1").fetchone()
            return self.send_json(200,{"settings":{"carousel_enabled":bool(row[0]),"notices_page_blocked":bool(row[1])}})
        if path == "/api/menu":
            with db() as conn:
                sql="SELECT * FROM menu_items" if self.session() else "SELECT * FROM menu_items WHERE active=1"
                rows=conn.execute(sql+" ORDER BY display_order,id").fetchall()
            return self.send_json(200,{"items":[dict(r) for r in rows]})
        if path == "/api/notices":
            with db() as conn:
                authenticated=bool(self.session())
                sql="SELECT * FROM notices" if authenticated else "SELECT * FROM notices WHERE active=1"
                rows=conn.execute(sql+" ORDER BY display_order,id").fetchall()
            notices=[]
            for row in rows:
                item=dict(row);item["banner_resolved"]=resolve_banner(item["banner_file"]);notices.append(item)
            return self.send_json(200,{"notices":notices})
        if path == "/api/users":
            if not self.require_master(): return
            with db() as conn: rows = conn.execute("SELECT * FROM users ORDER BY name").fetchall()
            return self.send_json(200, {"users": [user_public(r) for r in rows]})
        if path == "/api/requests":
            if not self.require_master(): return
            with db() as conn: rows = conn.execute("SELECT * FROM access_requests ORDER BY id DESC").fetchall()
            return self.send_json(200, {"requests": [dict(r) for r in rows]})
        if path == "/api/profiles":
            if not self.require_auth(): return
            with db() as conn: rows = conn.execute("SELECT * FROM header_profiles ORDER BY id").fetchall()
            return self.send_json(200, {"profiles": [dict(r) for r in rows]})
        if path == "/api/change-control":
            if not self.require_auth(): return
            with db() as conn:
                control=dict(conn.execute("SELECT * FROM change_control WHERE id=1").fetchone())
                control["pending_count"]=conn.execute("SELECT COUNT(*) FROM pending_changes WHERE status='pending'").fetchone()[0]
            return self.send_json(200,{"control":control})
        if path == "/api/pending-changes":
            if not self.require_master(): return
            with db() as conn: rows=conn.execute("SELECT * FROM pending_changes WHERE status='pending' ORDER BY id DESC").fetchall()
            return self.send_json(200,{"changes":[dict(r) for r in rows]})
        return self.static(path)

    def do_POST(self):
        path, data = urlparse(self.path).path, self.json_body()
        if path == "/api/login":
            cpf = clean_cpf(data.get("cpf"))
            with db() as conn: row = conn.execute("SELECT * FROM users WHERE cpf=? AND active=1", (cpf,)).fetchone()
            if not row or not password_ok(str(data.get("password", "")), row["password_hash"]):
                return self.send_json(401, {"error": "CPF ou senha inválidos."})
            token = secrets.token_urlsafe(32); SESSIONS[token] = {**user_public(row), "expires": time.time() + 8*3600}
            return self.send_json(200, {"user": user_public(row)}, {"Set-Cookie": f"ssp_session={token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800"})
        if path == "/api/logout":
            jar = cookies.SimpleCookie(self.headers.get("Cookie")); token = jar.get("ssp_session")
            if token: SESSIONS.pop(token.value, None)
            return self.send_json(200, {"message":"Sessão encerrada."}, {"Set-Cookie":"ssp_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0"})
        if path == "/api/access-requests":
            required = ("name","cpf","email","unit")
            if any(not str(data.get(k, "")).strip() for k in required): return self.send_json(400,{"error":"Preencha todos os campos."})
            with db() as conn: conn.execute("INSERT INTO access_requests(name,cpf,email,unit) VALUES(?,?,?,?)",(data["name"].strip(),clean_cpf(data["cpf"]),data["email"].strip(),data["unit"].strip()))
            return self.send_json(201,{"message":"Solicitação enviada com sucesso."})
        if path == "/api/users":
            if not self.require_master(): return
            if len(str(data.get("password",""))) < 8: return self.send_json(400,{"error":"A senha deve possuir ao menos 8 caracteres."})
            try:
                with db() as conn: conn.execute("INSERT INTO users(name,cpf,email,role,password_hash) VALUES(?,?,?,?,?)",(data["name"].strip(),clean_cpf(data["cpf"]),data["email"].strip(),data.get("role","site"),password_hash(data["password"])))
            except (sqlite3.IntegrityError, KeyError): return self.send_json(409,{"error":"CPF ou e-mail já cadastrado."})
            return self.send_json(201,{"message":"Administrador cadastrado."})
        if path == "/api/profiles":
            session=self.require_auth()
            if not session:return
            if self.queue_if_required(session,"create","header_profile",None,data):return
            with db() as conn:
                if conn.execute("SELECT COUNT(*) FROM header_profiles").fetchone()[0] >= 5: return self.send_json(409,{"error":"O limite de 5 perfis foi atingido."})
                try: conn.execute("INSERT INTO header_profiles(name,logo,page_title,color_primary,color_secondary,color_detail,font_family) VALUES(?,?,?,?,?,?,?)",profile_values(data))
                except (sqlite3.IntegrityError, KeyError): return self.send_json(409,{"error":"Nome inválido ou já utilizado."})
            return self.send_json(201,{"message":"Perfil criado."})
        if path == "/api/menu":
            session=self.require_auth()
            if not session:return
            if not safe_url(data.get("url")):return self.send_json(400,{"error":"Use uma URL iniciada por https://, http://, / ou #."})
            if self.queue_if_required(session,"create","menu_item",None,data):return
            try:
                with db() as conn: conn.execute("INSERT INTO menu_items(title,description,url,display_order) VALUES(?,?,?,?)",(data["title"].strip(),str(data.get("description","")).strip(),data["url"].strip(),int(data.get("display_order",1))))
            except sqlite3.IntegrityError:return self.send_json(409,{"error":"Já existe um item nesta ordem. Escolha outra posição ou use a ordenação por arrastar."})
            except (KeyError,ValueError):return self.send_json(400,{"error":"Preencha todos os campos corretamente."})
            return self.send_json(201,{"message":"Item de menu incluído."})
        if path == "/api/notices":
            session=self.require_auth()
            if not session:return
            title=str(data.get("title","")).strip();description=str(data.get("description","")).strip();button_name=str(data.get("button_name","")).strip();button_url=str(data.get("button_url","")).strip()
            if not title or not description:return self.send_json(400,{"error":"Título e descrição são obrigatórios."})
            if button_name and not safe_url(button_url):return self.send_json(400,{"error":"Informe uma URL válida quando houver nome do botão."})
            if self.queue_if_required(session,"create","notice",None,data):return
            try:
                with db() as conn:insert_notice_first(conn,(title,description,str(data.get("banner_file","")).strip(),button_name,button_url,1 if data.get("active") else 0,1 if data.get("active_carousel") else 0))
            except sqlite3.IntegrityError:return self.send_json(409,{"error":"Já existe um aviso nesta ordem. Use a ordenação por arrastar."})
            except (ValueError,TypeError):return self.send_json(400,{"error":"Ordem inválida."})
            return self.send_json(201,{"message":"Aviso incluído."})
        self.send_json(404,{"error":"Rota não encontrada."})

    def do_PUT(self):
        path, data = urlparse(self.path).path, self.json_body()
        if path.startswith("/api/users/"):
            if not self.require_master(): return
            try: uid=int(path.rsplit("/",1)[1])
            except ValueError: return self.send_json(400,{"error":"Identificador inválido."})
            fields=[data["name"].strip(),clean_cpf(data["cpf"]),data["email"].strip(),data["role"],1 if data.get("active",True) else 0]
            sql="UPDATE users SET name=?,cpf=?,email=?,role=?,active=?"
            if data.get("password"):
                if len(data["password"])<8:return self.send_json(400,{"error":"A senha deve possuir ao menos 8 caracteres."})
                sql+=",password_hash=?"; fields.append(password_hash(data["password"]))
            try:
                with db() as conn: conn.execute(sql+" WHERE id=?",(*fields,uid))
            except (sqlite3.IntegrityError,KeyError): return self.send_json(409,{"error":"CPF ou e-mail já cadastrado."})
            return self.send_json(200,{"message":"Administrador atualizado."})
        if path.startswith("/api/profiles/"):
            session=self.require_auth()
            if not session:return
            try: pid=int(path.rsplit("/",1)[1])
            except ValueError:return self.send_json(400,{"error":"Identificador inválido."})
            action="activate" if data.get("activate") else "update"
            if self.queue_if_required(session,action,"header_profile",pid,data):return
            with db() as conn:
                if data.get("activate"):
                    conn.execute("UPDATE header_profiles SET active=0");conn.execute("UPDATE header_profiles SET active=1 WHERE id=?",(pid,))
                else:
                    try: conn.execute("UPDATE header_profiles SET name=?,logo=?,page_title=?,color_primary=?,color_secondary=?,color_detail=?,font_family=? WHERE id=?",(*profile_values(data),pid))
                    except sqlite3.IntegrityError:return self.send_json(409,{"error":"Nome já utilizado."})
            return self.send_json(200,{"message":"Perfil atualizado."})
        if path == "/api/menu/reorder":
            session=self.require_auth()
            if not session:return
            if self.queue_if_required(session,"reorder","menu_item",None,data):return
            try:
                with db() as conn:reorder_menu(conn,data.get("ids",[]))
            except (ValueError,TypeError):return self.send_json(409,{"error":"A lista mudou. Atualize os dados e tente novamente."})
            return self.send_json(200,{"message":"Ordem do menu atualizada."})
        if path.startswith("/api/menu/") and "active" in data and "title" not in data:
            session=self.require_auth()
            if not session:return
            try:item_id=int(path.rsplit("/",1)[1])
            except ValueError:return self.send_json(400,{"error":"Identificador inválido."})
            payload={"active":bool(data["active"])}
            if self.queue_if_required(session,"status","menu_item",item_id,payload):return
            with db() as conn:conn.execute("UPDATE menu_items SET active=? WHERE id=?",(1 if payload["active"] else 0,item_id))
            return self.send_json(200,{"message":"Item de menu ativado." if payload["active"] else "Item de menu inativado."})
        if path.startswith("/api/menu/"):
            session=self.require_auth()
            if not session:return
            if not safe_url(data.get("url")):return self.send_json(400,{"error":"Use uma URL iniciada por https://, http://, / ou #."})
            try:item_id=int(path.rsplit("/",1)[1])
            except ValueError:return self.send_json(400,{"error":"Identificador inválido."})
            if self.queue_if_required(session,"update","menu_item",item_id,data):return
            try:
                with db() as conn: conn.execute("UPDATE menu_items SET title=?,description=?,url=?,display_order=? WHERE id=?",(data["title"].strip(),str(data.get("description","")).strip(),data["url"].strip(),int(data.get("display_order",1)),item_id))
            except sqlite3.IntegrityError:return self.send_json(409,{"error":"Já existe um item nesta ordem. Escolha outra posição ou use a ordenação por arrastar."})
            except (KeyError,ValueError):return self.send_json(400,{"error":"Preencha todos os campos corretamente."})
            return self.send_json(200,{"message":"Item de menu atualizado."})
        if path == "/api/notices/bulk-status":
            session=self.require_auth()
            if not session:return
            try:ids=[int(value) for value in data.get("ids",[])]
            except (ValueError,TypeError):return self.send_json(400,{"error":"Seleção inválida."})
            if not ids:return self.send_json(400,{"error":"Selecione ao menos um aviso."})
            payload={"ids":ids,"active":bool(data.get("active"))}
            if self.queue_if_required(session,"bulk_status","notice",None,payload):return
            placeholders=",".join("?" for _ in ids)
            with db() as conn:conn.execute(f"UPDATE notices SET active=? WHERE id IN ({placeholders})",(1 if payload["active"] else 0,*ids))
            return self.send_json(200,{"message":f"{len(ids)} aviso(s) {'ativado(s)' if payload['active'] else 'inativado(s)'}."})
        if path == "/api/notices/bulk-carousel":
            session=self.require_auth()
            if not session:return
            try:ids=[int(value) for value in data.get("ids",[])]
            except (ValueError,TypeError):return self.send_json(400,{"error":"Seleção inválida."})
            if not ids:return self.send_json(400,{"error":"Selecione ao menos um aviso."})
            payload={"ids":ids,"active_carousel":bool(data.get("active_carousel"))}
            if self.queue_if_required(session,"bulk_carousel","notice",None,payload):return
            placeholders=",".join("?" for _ in ids)
            with db() as conn:conn.execute(f"UPDATE notices SET active_carousel=? WHERE id IN ({placeholders})",(1 if payload["active_carousel"] else 0,*ids))
            return self.send_json(200,{"message":f"{len(ids)} aviso(s) {'adicionado(s) ao' if payload['active_carousel'] else 'removido(s) do'} carrossel."})
        if path == "/api/notices/reorder":
            session=self.require_auth()
            if not session:return
            if self.queue_if_required(session,"reorder","notice",None,data):return
            try:
                with db() as conn:reorder_notices(conn,data.get("ids",[]))
            except (ValueError,TypeError):return self.send_json(409,{"error":"A lista mudou. Atualize e tente novamente."})
            return self.send_json(200,{"message":"Ordem dos avisos atualizada."})
        if path.startswith("/api/notices/"):
            session=self.require_auth()
            if not session:return
            try:item_id=int(path.rsplit("/",1)[1])
            except ValueError:return self.send_json(400,{"error":"Identificador inválido."})
            title=str(data.get("title","")).strip();description=str(data.get("description","")).strip();button_name=str(data.get("button_name","")).strip();button_url=str(data.get("button_url","")).strip()
            if not title or not description:return self.send_json(400,{"error":"Título e descrição são obrigatórios."})
            if button_name and not safe_url(button_url):return self.send_json(400,{"error":"Informe uma URL válida quando houver nome do botão."})
            if self.queue_if_required(session,"update","notice",item_id,data):return
            try:
                with db() as conn:conn.execute("""UPDATE notices SET title=?,description=?,banner_file=?,button_name=?,button_url=?,active=?,active_carousel=?,display_order=? WHERE id=?""",(title,description,str(data.get("banner_file","")).strip(),button_name,button_url,1 if data.get("active") else 0,1 if data.get("active_carousel") else 0,int(data.get("display_order",1)),item_id))
            except sqlite3.IntegrityError:return self.send_json(409,{"error":"Já existe um aviso nesta ordem. Use a ordenação por arrastar."})
            return self.send_json(200,{"message":"Aviso atualizado."})
        if path == "/api/change-control":
            session=self.require_master()
            if not session:return
            locked=bool(data.get("locked"));note=""
            with db() as conn:
                pending=conn.execute("SELECT COUNT(*) FROM pending_changes WHERE status='pending'").fetchone()[0]
                if not locked and pending:return self.send_json(409,{"error":f"Existem {pending} alterações pendentes. Valide-as antes de desmarcar o bloqueio.","pending_count":pending})
                conn.execute("UPDATE change_control SET locked=?,note=?,carousel_enabled=?,updated_at=CURRENT_TIMESTAMP WHERE id=1",(1 if locked else 0,note,0 if locked else 1))
                if locked:conn.execute("UPDATE notices SET active=0,active_carousel=0")
            return self.send_json(200,{"message":"Controle de alterações atualizado."})
        if path == "/api/site-settings":
            if not self.require_master():return
            allowed={"carousel_enabled","notices_page_blocked"};setting=str(data.get("setting",""))
            if setting not in allowed:return self.send_json(400,{"error":"Configuração inválida."})
            value=1 if data.get("value") else 0
            with db() as conn:conn.execute(f"UPDATE change_control SET {setting}=?,updated_at=CURRENT_TIMESTAMP WHERE id=1",(value,))
            return self.send_json(200,{"message":"Configuração atualizada."})
        if path.startswith("/api/pending-changes/"):
            session=self.require_master()
            if not session:return
            try: change_id=int(path.rsplit("/",1)[1])
            except ValueError:return self.send_json(400,{"error":"Identificador inválido."})
            decision=data.get("decision")
            if decision not in ("approved","rejected"):return self.send_json(400,{"error":"Decisão inválida."})
            with db() as conn:
                row=conn.execute("SELECT * FROM pending_changes WHERE id=? AND status='pending'",(change_id,)).fetchone()
                if not row:return self.send_json(404,{"error":"Alteração pendente não encontrada."})
                if decision=="approved":
                    payload=json.loads(row["payload"]);pid=row["entity_id"]
                    try:
                        if row["entity"]=="notice":
                            if row["action"]=="bulk_status":
                                ids=[int(value) for value in payload.get("ids",[])];placeholders=",".join("?" for _ in ids)
                                if not ids:raise ValueError("Seleção vazia")
                                conn.execute(f"UPDATE notices SET active=? WHERE id IN ({placeholders})",(1 if payload.get("active") else 0,*ids))
                            elif row["action"]=="bulk_carousel":
                                ids=[int(value) for value in payload.get("ids",[])];placeholders=",".join("?" for _ in ids)
                                if not ids:raise ValueError("Seleção vazia")
                                conn.execute(f"UPDATE notices SET active_carousel=? WHERE id IN ({placeholders})",(1 if payload.get("active_carousel") else 0,*ids))
                            elif row["action"]=="reorder":reorder_notices(conn,payload.get("ids",[]))
                            elif row["action"]=="create":insert_notice_first(conn,(payload["title"].strip(),payload["description"].strip(),str(payload.get("banner_file","")).strip(),str(payload.get("button_name","")).strip(),str(payload.get("button_url","")).strip(),1 if payload.get("active") else 0,1 if payload.get("active_carousel") else 0))
                            elif row["action"]=="update":conn.execute("""UPDATE notices SET title=?,description=?,banner_file=?,button_name=?,button_url=?,active=?,active_carousel=?,display_order=? WHERE id=?""",(payload["title"].strip(),payload["description"].strip(),str(payload.get("banner_file","")).strip(),str(payload.get("button_name","")).strip(),str(payload.get("button_url","")).strip(),1 if payload.get("active") else 0,1 if payload.get("active_carousel") else 0,int(payload.get("display_order",1)),pid))
                            elif row["action"]=="delete":conn.execute("DELETE FROM notices WHERE id=?",(pid,))
                        elif row["entity"]=="menu_item":
                            if row["action"]=="reorder":reorder_menu(conn,payload.get("ids",[]))
                            elif row["action"]=="create":conn.execute("INSERT INTO menu_items(title,description,url,display_order) VALUES(?,?,?,?)",(payload["title"].strip(),str(payload.get("description","")).strip(),payload["url"].strip(),int(payload.get("display_order",1))))
                            elif row["action"]=="update":conn.execute("UPDATE menu_items SET title=?,description=?,url=?,display_order=? WHERE id=?",(payload["title"].strip(),str(payload.get("description","")).strip(),payload["url"].strip(),int(payload.get("display_order",1)),pid))
                            elif row["action"]=="status":conn.execute("UPDATE menu_items SET active=? WHERE id=?",(1 if payload.get("active") else 0,pid))
                            elif row["action"]=="delete":conn.execute("DELETE FROM menu_items WHERE id=?",(pid,))
                        elif row["action"]=="create":
                            if conn.execute("SELECT COUNT(*) FROM header_profiles").fetchone()[0]>=5:return self.send_json(409,{"error":"O limite de 5 perfis foi atingido."})
                            conn.execute("INSERT INTO header_profiles(name,logo,page_title,color_primary,color_secondary,color_detail,font_family) VALUES(?,?,?,?,?,?,?)",profile_values(payload))
                        elif row["action"]=="update":conn.execute("UPDATE header_profiles SET name=?,logo=?,page_title=?,color_primary=?,color_secondary=?,color_detail=?,font_family=? WHERE id=?",(*profile_values(payload),pid))
                        elif row["action"]=="activate":conn.execute("UPDATE header_profiles SET active=0");conn.execute("UPDATE header_profiles SET active=1 WHERE id=?",(pid,))
                        elif row["action"]=="delete":conn.execute("DELETE FROM header_profiles WHERE id=? AND active=0 AND name<>'Paleta Padrão'",(pid,))
                    except (sqlite3.IntegrityError,KeyError,ValueError,TypeError):return self.send_json(409,{"error":"A alteração não pode mais ser aplicada; atualize a fila e verifique ordens ou dados duplicados."})
                conn.execute("UPDATE pending_changes SET status=?,reviewed_by=?,reviewed_at=CURRENT_TIMESTAMP WHERE id=?",(decision,session["id"],change_id))
            return self.send_json(200,{"message":"Alteração aprovada e aplicada." if decision=="approved" else "Alteração recusada."})
        if path.startswith("/api/requests/"):
            if not self.require_master(): return
            rid=int(path.rsplit("/",1)[1]); status=data.get("status")
            if status not in ("approved","rejected"):return self.send_json(400,{"error":"Status inválido."})
            with db() as conn:
                row=conn.execute("SELECT * FROM access_requests WHERE id=?",(rid,)).fetchone()
                if not row:return self.send_json(404,{"error":"Solicitação não encontrada."})
                conn.execute("UPDATE access_requests SET status=? WHERE id=?",(status,rid))
                if status=="approved" and not conn.execute("SELECT 1 FROM users WHERE cpf=?",(row["cpf"],)).fetchone():
                    temp=secrets.token_urlsafe(9);conn.execute("INSERT INTO users(name,cpf,email,role,password_hash) VALUES(?,?,?,?,?)",(row["name"],row["cpf"],row["email"],"site",password_hash(temp)))
                    return self.send_json(200,{"message":"Acesso aprovado.","temporary_password":temp})
            return self.send_json(200,{"message":"Solicitação atualizada."})
        self.send_json(404,{"error":"Rota não encontrada."})

    def do_DELETE(self):
        path=urlparse(self.path).path
        session=self.require_auth()
        if not session:return
        try: item_id=int(path.rsplit("/",1)[1])
        except ValueError:return self.send_json(400,{"error":"Identificador inválido."})
        if path.startswith("/api/users/") and session["role"]!="master":return self.send_json(403,{"error":"Ação exclusiva do Administrador Master."})
        if path.startswith("/api/profiles/") and self.queue_if_required(session,"delete","header_profile",item_id,{}):return
        if path.startswith("/api/menu/") and self.queue_if_required(session,"delete","menu_item",item_id,{}):return
        if path.startswith("/api/notices/") and self.queue_if_required(session,"delete","notice",item_id,{}):return
        with db() as conn:
            if path.startswith("/api/users/"):
                if item_id==self.session()["id"]:return self.send_json(409,{"error":"Você não pode excluir o próprio usuário."})
                conn.execute("DELETE FROM users WHERE id=?",(item_id,))
            elif path.startswith("/api/profiles/"):
                row=conn.execute("SELECT active,name FROM header_profiles WHERE id=?",(item_id,)).fetchone()
                if not row:return self.send_json(404,{"error":"Perfil não encontrado."})
                if row["active"]:return self.send_json(409,{"error":"O perfil em uso não pode ser excluído."})
                if row["name"]=="Paleta Padrão":return self.send_json(409,{"error":"A Paleta Padrão não pode ser excluída."})
                conn.execute("DELETE FROM header_profiles WHERE id=?",(item_id,))
            elif path.startswith("/api/menu/"):
                conn.execute("DELETE FROM menu_items WHERE id=?",(item_id,))
            elif path.startswith("/api/notices/"):
                conn.execute("DELETE FROM notices WHERE id=?",(item_id,))
            else:return self.send_json(404,{"error":"Rota não encontrada."})
        return self.send_json(200,{"message":"Registro excluído."})

    def static(self,path):
        if path=="/":path="/index.html"
        if path=="/avisos.html":
            with db() as conn:blocked=conn.execute("SELECT notices_page_blocked FROM change_control WHERE id=1").fetchone()[0]
            if blocked:return self.send_error(403,"A página de avisos está temporariamente indisponível.")
        target=(ROOT/unquote(path).lstrip("/")).resolve()
        if ROOT not in target.parents or not target.is_file():return self.send_error(404)
        body=target.read_bytes();self.send_response(200);self.send_header("Content-Type",mimetypes.guess_type(target)[0] or "application/octet-stream");self.send_header("Content-Length",str(len(body)));self.end_headers();self.wfile.write(body)


if __name__ == "__main__":
    initialize()
    port = int(os.environ.get("PORT", "8088"))
    print(f"Intranet SSP disponível em http://127.0.0.1:{port}")
    ThreadingHTTPServer(("127.0.0.1", port), Handler).serve_forever()
