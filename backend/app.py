import hmac
import json
import os
import time
from functools import wraps
from hashlib import sha256
from pathlib import Path
from uuid import uuid4

import bcrypt
import click
import jwt
from dotenv import load_dotenv
from email_validator import EmailNotValidError, validate_email
from flask import Flask, Response, abort, g, request, stream_with_context
from psycopg.errors import UniqueViolation
from werkzeug.exceptions import HTTPException

from agent import get_model, graph, model_settings
from db import database, init_schema, query
from knowledge import ingest

load_dotenv(Path(__file__).with_name(".env"))
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 4_000_000
COOKIE = "itip_session"
SESSION_AGE = 7 * 24 * 60 * 60


def now_ms():
    return int(time.time() * 1000)


def body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        abort(400, "请求须为 JSON 对象")
    return data


@app.before_request
def require_proxy():
    if not request.path.startswith("/api/") or request.path == "/api/health":
        return
    secret = os.getenv("BACKEND_PROXY_SECRET", "")
    if os.getenv("VERCEL") and not secret:
        abort(503, "后端代理尚未配置")
    supplied = request.headers.get("X-iTip-Proxy-Secret", "")
    if secret and not hmac.compare_digest(secret.encode(), supplied.encode()):
        abort(403, "请通过 iTip 站点访问")


@app.after_request
def disable_api_caching(response):
    response.headers["Cache-Control"] = "no-store"
    return response


@app.errorhandler(HTTPException)
def http_error(error):
    response = app.json.response({"error": error.description})
    response.status_code = error.code
    return response


@app.errorhandler(500)
def internal_error(_error):
    return {"error": "服务暂时不可用"}, 500


def auth_secret():
    secret = os.getenv("AUTH_SECRET", "")
    if len(secret) < 16:
        abort(503, "登录服务尚未配置")
    return secret


def session_user():
    token = request.cookies.get(COOKIE)
    if not token:
        return None
    try:
        payload = jwt.decode(token, auth_secret(), algorithms=["HS256"],
                             options={"require": ["sub", "exp", "email"]})
    except jwt.InvalidTokenError:
        return None
    with database() as conn:
        row = query(conn, "SELECT id, email FROM users WHERE id = %(id)s",
                    id=payload["sub"]).fetchone()
        return row


def signed_in(handler):
    @wraps(handler)
    def wrapped(*args, **kwargs):
        g.user = session_user()
        if not g.user:
            abort(401, "需要登录")
        return handler(*args, **kwargs)
    return wrapped


def authenticated_response(user_id, email):
    token = jwt.encode({"sub": user_id, "email": email,
                        "exp": int(time.time()) + SESSION_AGE}, auth_secret(), algorithm="HS256")
    response = app.json.response({"ok": True})
    response.set_cookie(COOKIE, token, max_age=SESSION_AGE, httponly=True, samesite="Lax",
                        secure=bool(os.getenv("VERCEL") or os.getenv("COOKIE_SECURE") == "1"))
    return response


def throttle(scope, identity, limit, seconds):
    key = f"{scope}:{hmac.new(auth_secret().encode(), identity.encode(), sha256).hexdigest()}"
    now = int(time.time())
    with database() as conn:
        row = query(conn, """
            INSERT INTO rate_limits (key, hits, reset_at) VALUES (%(key)s, 1, %(until)s)
            ON CONFLICT (key) DO UPDATE SET
                hits = CASE WHEN rate_limits.reset_at <= %(now)s THEN 1 ELSE rate_limits.hits + 1 END,
                reset_at = CASE WHEN rate_limits.reset_at <= %(now)s THEN %(until)s ELSE rate_limits.reset_at END
            RETURNING hits, reset_at
        """, key=key, now=now, until=now + seconds).fetchone()
        if row["hits"] == 1:
            query(conn, "DELETE FROM rate_limits WHERE reset_at < %(expired)s", expired=now - 3600)
    if row["hits"] > limit:
        response = app.json.response({"error": "请求过于频繁，请稍后再试"})
        response.status_code = 429
        response.headers["Retry-After"] = str(row["reset_at"] - now)
        abort(response)


def client_ip():
    if os.getenv("BACKEND_PROXY_SECRET"):
        return request.headers.get("X-iTip-Client-IP") or request.remote_addr or "unknown"
    return request.remote_addr or "unknown"


def credentials(data, minimum=1):
    password = data.get("password")
    email = data.get("email")
    if not isinstance(email, str) or len(email) > 256 or not valid_password(password, minimum):
        abort(400, "请填写有效邮箱与密码")
    try:
        validate_email(email, check_deliverability=False, test_environment=not bool(os.getenv("VERCEL")))
    except EmailNotValidError:
        abort(400, "请填写有效邮箱")
    return email, password


def valid_password(password, minimum=1):
    return isinstance(password, str) and minimum <= len(password) <= 200


def password_bytes(password):
    return password.encode()[:72]  # Preserve compatibility with existing bcryptjs hashes.


@app.get("/api/health")
def health():
    with database() as conn:
        query(conn, "SELECT id FROM users LIMIT 1")
        query(conn, "SELECT id FROM chat_conversations LIMIT 1")
        count = query(conn, "SELECT COUNT(*) AS total FROM kb_sources").fetchone()["total"]
    return {"ok": True, "knowledgeSources": count}


@app.post("/api/auth/register")
def register():
    throttle("register", client_ip(), 5, 600)
    email, password = credentials(body(), minimum=8)
    user_id = str(uuid4())
    digest = bcrypt.hashpw(password_bytes(password), bcrypt.gensalt(rounds=10)).decode()
    try:
        with database() as conn:
            query(conn, """INSERT INTO users (id, email, password_hash, created_at)
                           VALUES (%(id)s, %(email)s, %(digest)s, %(now)s)""",
                  id=user_id, email=email, digest=digest, now=now_ms())
    except UniqueViolation:
        abort(409, "该邮箱已注册")
    return authenticated_response(user_id, email)


@app.post("/api/auth/login")
def login():
    throttle("login", client_ip(), 10, 60)
    email, password = credentials(body())
    throttle("login-email", email.casefold(), 5, 300)
    with database() as conn:
        row = query(conn, "SELECT id, password_hash FROM users WHERE email = %(email)s",
                    email=email).fetchone()
    if not row or not bcrypt.checkpw(password_bytes(password), row["password_hash"].encode()):
        abort(401, "邮箱或密码错误")
    return authenticated_response(row["id"], email)


@app.post("/api/auth/logout")
def logout():
    response = app.json.response({"ok": True})
    response.delete_cookie(COOKIE, httponly=True, samesite="Lax",
                           secure=bool(os.getenv("VERCEL") or os.getenv("COOKIE_SECURE") == "1"))
    return response


@app.get("/api/auth/me")
def me():
    return {"user": session_user()}


@app.put("/api/auth/password")
@signed_in
def password():
    throttle("password", g.user["id"], 5, 600)
    data = body()
    current, new = data.get("currentPassword"), data.get("newPassword")
    if not valid_password(current) or not valid_password(new, 8):
        abort(400, "请填写当前密码，新密码至少 8 位")
    with database() as conn:
        user_id = g.user["id"]
        row = query(conn, "SELECT password_hash FROM users WHERE id = %(id)s", id=user_id).fetchone()
        if not row or not bcrypt.checkpw(password_bytes(current), row["password_hash"].encode()):
            abort(400, "当前密码错误")
        updated = query(conn, """UPDATE users SET password_hash = %(new)s
                                 WHERE id = %(id)s AND password_hash = %(old)s""", id=user_id, old=row["password_hash"],
                        new=bcrypt.hashpw(password_bytes(new), bcrypt.gensalt(rounds=10)).decode())
        if not updated.rowcount:
            abort(409, "密码已变更，请重试")
    return {"ok": True}


@app.route("/api/chat/conversations", methods=["GET", "POST"])
@signed_in
def conversations():
    user_id = g.user["id"]
    if request.method == "POST":
        conversation_id = str(uuid4())
        with database() as conn:
            query(conn, """INSERT INTO chat_conversations (id, user_id, created_at, updated_at)
                           VALUES (%(id)s, %(user)s, %(now)s, %(now)s)""",
                  id=conversation_id, user=user_id, now=now_ms())
        return {"id": conversation_id}
    with database() as conn:
        rows = query(conn, """SELECT id, title, updated_at, pinned FROM chat_conversations
                              WHERE user_id = %(user)s ORDER BY pinned DESC, updated_at DESC, id""",
                     user=user_id).fetchall()
    return {"conversations": [{"id": row["id"], "title": row["title"],
                               "updatedAt": row["updated_at"], "pinned": row["pinned"]} for row in rows]}


def checked_messages(messages):
    if not isinstance(messages, list):
        abort(400, "messages 须为数组")
    for message in messages:
        if (not isinstance(message, dict) or message.get("role") not in ("user", "assistant")
                or not isinstance(message.get("id"), str) or not isinstance(message.get("parts"), list)):
            abort(400, "消息格式无效")
        for part in message["parts"]:
            if not isinstance(part, dict) or not isinstance(part.get("type"), str):
                abort(400, "消息内容无效")
            if part.get("type") == "text" and not isinstance(part.get("text"), str):
                abort(400, "消息文字无效")
            if part.get("type") == "file":
                url = part.get("url")
                if not isinstance(url, str) or not url.startswith("data:image/") or ";base64," not in url:
                    abort(400, "附图必须是内联图片")
    return messages


def derive_title(messages):
    for message in messages:
        if message["role"] == "user":
            title = " ".join("".join(p["text"] for p in message["parts"] if p.get("type") == "text").split())
            if title:
                return title if len(title) <= 48 else title[:47] + "…"
    return "新对话"


@app.route("/api/chat/conversations/<conversation_id>", methods=["GET", "PATCH", "DELETE"])
@signed_in
def conversation(conversation_id):
    params = {"id": conversation_id, "user": g.user["id"]}
    where = " WHERE id = %(id)s AND user_id = %(user)s"
    if request.method == "GET":
        with database() as conn:
            row = query(conn, "SELECT id, title, messages_json FROM chat_conversations" + where, **params).fetchone()
        if not row:
            abort(404, "未找到")
        try:
            messages = json.loads(row["messages_json"])
        except ValueError:
            messages = []
        return {"id": row["id"], "title": row["title"], "messages": messages if isinstance(messages, list) else []}
    if request.method == "DELETE":
        sql = "DELETE FROM chat_conversations"
    else:
        data = body()
        if "messages" in data:
            messages = checked_messages(data["messages"])
            params.update(messages=json.dumps(messages, ensure_ascii=False),
                          title=derive_title(messages), now=now_ms())
            sql = """UPDATE chat_conversations SET messages_json = %(messages)s, updated_at = %(now)s,
                     title = CASE WHEN trim(title) = '' THEN %(title)s ELSE title END"""
        elif isinstance(data.get("title"), str):
            params.update(title=data["title"].strip(), now=now_ms())
            sql = "UPDATE chat_conversations SET title = %(title)s, updated_at = %(now)s"
        elif isinstance(data.get("pinned"), bool):
            params.update(pinned=int(data["pinned"]))
            sql = "UPDATE chat_conversations SET pinned = %(pinned)s"
        else:
            abort(400, "无效操作")
    with database() as conn:
        if not query(conn, sql + where, **params).rowcount:
            abort(404, "未找到")
    return {"ok": True}


def sse(kind, **data):
    return f"data: {json.dumps({'type': kind, **data}, ensure_ascii=False)}\n\n"


@app.post("/api/chat")
@signed_in
def chat():
    messages = checked_messages(body().get("messages"))
    if not any(message["role"] == "user" and any(
        p.get("type") == "file" or (p.get("type") == "text" and p["text"].strip())
        for p in message["parts"]
    ) for message in messages):
        abort(400, "请输入文字或选择图片")
    throttle("chat", g.user["id"], 30, 60)
    vision = any(p.get("type") == "file" for m in messages if m["role"] == "user" for p in m["parts"])
    try:
        model_settings(vision=vision)
    except ValueError as error:
        abort(503, str(error))

    @stream_with_context
    def generate():
        text_id = str(uuid4())
        yield sse("start", messageId=str(uuid4()))
        yield sse("start-step")
        yield sse("text-start", id=text_id)
        try:
            for delta in graph.stream({"messages": messages}, stream_mode="custom"):
                yield sse("text-delta", id=text_id, delta=delta)
            yield sse("text-end", id=text_id)
            yield sse("finish-step")
            yield sse("finish", finishReason="stop")
        except Exception as error:
            app.logger.warning("Chat generation failed (%s)", type(error).__name__)
            yield sse("text-end", id=text_id)
            yield sse("error", errorText="模型或知识库暂时不可用，请稍后重试")
        yield "data: [DONE]\n\n"

    return Response(generate(), content_type="text/event-stream; charset=utf-8",
                    headers={"x-vercel-ai-ui-message-stream": "v1", "X-Accel-Buffering": "no"})


@app.post("/api/images/generate")
@signed_in
def generate_image():
    data = body()
    prompt, size = data.get("prompt"), data.get("size", "1024x1024")
    if not isinstance(prompt, str) or not 1 <= len(prompt.strip()) <= 1000:
        abort(400, "请提供有效的出图提示词")
    if size not in ("1024x1024", "768x1024", "1024x768"):
        abort(400, "不支持的图片尺寸")
    throttle("image", g.user["id"], 10, 600)
    try:
        client, model = get_model(image=True)
    except ValueError as error:
        abort(503, str(error))
    try:
        with client:
            result = client.images.generate(model=model, prompt=prompt, size=size, n=1)
        image = result.data[0]
        url = image.url or (f"data:image/png;base64,{image.b64_json}" if image.b64_json else None)
        if not url:
            abort(502, "模型未返回图片")
    except HTTPException:
        raise
    except Exception as error:
        app.logger.warning("Image generation failed (%s)", type(error).__name__)
        abort(502, "图片生成失败，请检查模型配置后重试")
    if len(url) > 4_000_000:
        abort(502, "生成图片过大，请使用返回 HTTPS 图片地址的模型")
    return {"url": url, "model": model, "size": size}


@app.cli.command("init-db")
def init_db_command():
    init_schema()
    print("Database schema initialized.")


@app.cli.command("ingest")
@click.argument("path", type=click.Path(exists=True, dir_okay=False))
def ingest_command(path):
    print(f"Imported {ingest(path)} knowledge sources.")

