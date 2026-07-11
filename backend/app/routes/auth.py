import json
import urllib.parse
import urllib.request
import urllib.error

import httpx
from fastapi import APIRouter
from fastapi.responses import HTMLResponse, RedirectResponse

from app.core.config import get_settings

router = APIRouter(prefix="/auth", tags=["auth"])


def _exchange_code_for_token(code: str) -> dict:
    """Troca o código de autorização pelo access token na API da Nuvemshop."""
    settings = get_settings()
    token_url = "https://www.tiendanube.com/apps/authorize/token"
    payload = {
        "client_id": settings.nuvemshop_client_id,
        "client_secret": settings.nuvemshop_client_secret,
        "grant_type": "authorization_code",
        "code": code,
    }
    with httpx.Client(timeout=15) as client:
        response = client.post(
            token_url,
            json=payload,
            headers={"User-Agent": settings.nuvemshop_user_agent},
        )
        response.raise_for_status()
        return response.json()


@router.get("/nuvemshop/start", summary="Inicia o fluxo OAuth com a Nuvemshop")
def start_oauth():
    """Redireciona para a tela de autorização da Nuvemshop."""
    settings = get_settings()
    scopes = "read_products,write_products"
    auth_url = (
        f"https://www.nuvemshop.com.br/apps/{settings.nuvemshop_client_id}/authorize"
        f"?scope={scopes}"
    )
    return RedirectResponse(url=auth_url)


@router.get("/nuvemshop/callback", summary="Callback OAuth da Nuvemshop", response_class=HTMLResponse)
def oauth_callback(code: str = ""):
    """Recebe o código OAuth, troca pelo access token e exibe o resultado."""
    if not code:
        html = """
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#fef2f2">
        <h2 style="color:#dc2626">❌ Erro: código de autorização não recebido.</h2>
        <p>Tente iniciar o fluxo novamente pelo endpoint <code>/auth/nuvemshop/start</code>.</p>
        </body></html>
        """
        return HTMLResponse(content=html, status_code=400)

    try:
        data = _exchange_code_for_token(code)
        user_id = data.get("user_id", "—")
        access_token = data.get("access_token", "—")
        html = f"""
        <html>
        <head><title>Token Gerado!</title></head>
        <body style="font-family:sans-serif;max-width:600px;margin:60px auto;padding:20px;background:#f0fdf4;border-radius:12px">
          <h2 style="color:#16a34a">🎉 Token Gerado com Sucesso!</h2>
          <p>Copie os valores abaixo e cadastre a loja no sistema:</p>
          <table style="width:100%;border-collapse:collapse;margin-top:16px">
            <tr style="background:#dcfce7">
              <td style="padding:10px 16px;font-weight:bold;border:1px solid #86efac">ID da Loja (user_id)</td>
              <td style="padding:10px 16px;border:1px solid #86efac;font-family:monospace">{user_id}</td>
            </tr>
            <tr style="background:#f0fdf4">
              <td style="padding:10px 16px;font-weight:bold;border:1px solid #86efac">Access Token</td>
              <td style="padding:10px 16px;border:1px solid #86efac;font-family:monospace;word-break:break-all">{access_token}</td>
            </tr>
          </table>
          <p style="margin-top:24px;color:#6b7280;font-size:0.85rem">Guarde o Access Token em local seguro. Este endpoint ficará disponível apenas enquanto o servidor estiver rodando.</p>
        </body>
        </html>
        """
        return HTMLResponse(content=html)
    except httpx.HTTPStatusError as e:
        html = f"""
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#fef2f2">
        <h2 style="color:#dc2626">❌ Erro ao obter o token (HTTP {e.response.status_code})</h2>
        <pre style="text-align:left;background:#fff;padding:16px;border-radius:8px">{e.response.text}</pre>
        </body></html>
        """
        return HTMLResponse(content=html, status_code=502)
    except Exception as e:
        html = f"""
        <html><body style="font-family:sans-serif;text-align:center;padding:60px;background:#fef2f2">
        <h2 style="color:#dc2626">❌ Erro inesperado</h2>
        <pre style="text-align:left;background:#fff;padding:16px;border-radius:8px">{e}</pre>
        </body></html>
        """
        return HTMLResponse(content=html, status_code=500)
