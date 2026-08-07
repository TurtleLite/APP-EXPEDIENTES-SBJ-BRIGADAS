import sys
from unittest.mock import patch

sys.path.insert(0, ".")

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core import database
from app.core.database import Base
from app.core.security import hash_password
from app.models.user import User
from app.services import auth_service
from app.services.audit_service import list_logs

engine = create_engine("sqlite:///:memory:")
SessionLocal = sessionmaker(bind=engine)

with patch.object(database, "engine", engine), patch.object(database, "SessionLocal", SessionLocal):
    Base.metadata.create_all(engine)
    db = SessionLocal()
    u = User(username="testuser", telefono="9999-9999", full_name="Test User",
             hashed_password=hash_password("secret123"), role="admin", is_active=True)
    db.add(u)
    db.commit()
    db.refresh(u)
    uid = u.id

    class FakeCreds:
        def __init__(self, token):
            self.credentials = token

    class FakeRequest:
        def __init__(self, ip):
            self._headers = {}
            self.client = type("C", (), {"host": ip})()

        @property
        def headers(self):
            return self._headers

    req1 = FakeRequest("203.0.113.10")
    req2 = FakeRequest("203.0.113.99")

    # 1. login correcto
    r = auth_service.login(db, "testuser", "secret123", req1)
    token = r["access_token"]
    assert token and r["token_type"] == "bearer", "login OK"

    # 2. get_current_user con sesión activa
    user = auth_service.get_current_user(FakeCreds(token), db)
    assert user.id == uid, "get_current_user OK"

    # 3. 5 intentos fallidos -> bloqueo
    for i in range(5):
        try:
            auth_service.login(db, "testuser", "malapass", req1)
            assert False, f"debió fallar intento {i}"
        except Exception as e:
            status = getattr(e, "status_code", None)
            assert status == 401, f"intento {i} debe ser 401, fue {status}"

    # 6. siguiente intento -> bloqueado 423
    try:
        auth_service.login(db, "testuser", "secret123", req1)
        assert False, "debió estar bloqueado"
    except Exception as e:
        assert e.status_code == 423, f"esperaba 423, fue {getattr(e, 'status_code', None)}"

    # 7. rate limit por IP (intentos de otra IP)
    auth_service._clear_ip_failures("203.0.113.99")
    for i in range(20):
        try:
            auth_service.login(db, "testuser", "malapass", req2)
        except Exception:
            pass
    try:
        auth_service.login(db, "testuser", "malapass", req2)
        assert False, "debió estar limitado por IP"
    except Exception as e:
        assert e.status_code == 429, f"esperaba 429, fue {getattr(e, 'status_code', None)}"
    auth_service._clear_ip_failures("203.0.113.99")

    # 8. desbloquear y volver a entrar
    from app.services.user_service import unlock_user
    unlock_user(db, uid)
    r = auth_service.login(db, "testuser", "secret123", req1)
    token2 = r["access_token"]

    # 9. sesiones listadas y revocación
    sessions = auth_service.get_user_sessions(db, user, include_others=True)
    assert len(sessions) >= 2, f"sesiones: {len(sessions)}"
    active = [s for s in sessions if s["active"]]
    assert len(active) == 2, f"debe haber 2 activas, hay {len(active)}"
    sid = active[0]["id"]
    auth_service.revoke_user_session(db, int(sid), user, None)
    try:
        auth_service.get_current_user(FakeCreds(token2), db)
        assert False, "la sesión revocada debía fallar"
    except Exception as e:
        assert e.status_code == 401, f"esperaba 401, fue {getattr(e, 'status_code', None)}"
        print("sesión revocada rechazada OK")
    auth_service.get_current_user(FakeCreds(token), db)
    print("la otra sesión sigue activa OK")

    # 10. logout revoca la sesión actual
    from fastapi.security import HTTPAuthorizationCredentials
    creds = HTTPAuthorizationCredentials(scheme="Bearer", credentials=token2)
    auth_service.logout_current(db, creds, user, ip="127.0.0.1")
    try:
        auth_service.get_current_user(FakeCreds(token2), db)
        assert False, "la sesión cerrada debía fallar"
    except Exception as e:
        assert e.status_code == 401

    # 11. auditoría registrada
    items, total = list_logs(db)
    actions = [i.action for i in items]
    assert "login" in actions and "login_failed" in actions and "login_locked" in actions, actions
    assert "logout" in actions and "session_revoked" in actions

    # 12. login de nuevo y verificación final
    r3 = auth_service.login(db, "testuser", "secret123", req1)
    sessions2 = auth_service.get_user_sessions(db, user, include_others=True)
    print(f"total eventos de auditoría: {total}")
    print(f"sesiones tras relogin: {len(sessions2)}")
    print("TODAS LAS PRUEBAS PASARON")
