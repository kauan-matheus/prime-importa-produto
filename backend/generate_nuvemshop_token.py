import http.server
import json
import urllib.parse
import urllib.request
import webbrowser

PORT = 8080
REDIRECT_URI = f"http://localhost:{PORT}/callback"

# Configurações do aplicativo
client_id = input("1. Digite o seu Client ID do aplicativo Nuvemshop: ").strip()
client_secret = input("2. Digite o seu Client Secret do aplicativo Nuvemshop: ").strip()

print("\n--- INICIANDO FLUXO DE AUTENTICAÇÃO ---")
print("1. Um servidor local foi iniciado na porta 8080.")
print("2. Seu navegador abrirá a tela de autorização da Nuvemshop.")
print("3. Escolha a sua loja e clique em 'Autorizar'.")
print("---------------------------------------")

auth_code = None


class CallbackHandler(http.server.BaseHTTPRequestHandler):

    def do_GET(self):
        global auth_code
        parsed_url = urllib.parse.urlparse(self.path)
        if parsed_url.path == "/callback":
            query = urllib.parse.parse_qs(parsed_url.query)
            auth_code = query.get("code", [None])[0]

            self.send_response(200)
            self.send_header("Content-Type", "text/html; charset=utf-8")
            self.end_headers()

            if auth_code:
                html = """
                <html>
                <body style="font-family: sans-serif; text-align: center; padding-top: 50px; background-color: #f7fafc;">
                    <div style="display: inline-block; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <h1 style="color: #2b6cb0;">Autorização Recebida!</h1>
                        <p style="color: #4a5568;">Código capturado com sucesso. Pode fechar esta aba e voltar para o terminal.</p>
                    </div>
                </body>
                </html>
                """
                self.wfile.write(html.encode("utf-8"))
            else:
                self.wfile.write(b"Erro: Codigo de autorizacao nao encontrado.")
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Silencia logs do servidor HTTP no console para ficar limpo
        return


server = http.server.HTTPServer(("localhost", PORT), CallbackHandler)

# Monta a URL de autorização da Nuvemshop
# Escopos necessários para ler/escrever produtos
scopes = "read_products,write_products"
auth_url = f"https://www.nuvemshop.com.br/apps/{client_id}/authorize?scope={scopes}"

print(f"Abrindo navegador em: {auth_url}\n")
webbrowser.open(auth_url)

# Espera pela requisição de callback
server.handle_request()
server.server_close()

if auth_code:
    print(f"✓ Código de autorização recebido: {auth_code}")
    print("Trocando código por Access Token...")

    # Faz o POST para a Nuvemshop para obter o token de acesso
    token_url = "https://www.tiendanube.com/apps/authorize/token"
    payload = {
        "client_id": client_id,
        "client_secret": client_secret,
        "grant_type": "authorization_code",
        "code": auth_code,
    }
    data = json.dumps(payload).encode("utf-8")

    req = urllib.request.Request(
        token_url,
        data=data,
        headers={
            "Content-Type": "application/json",
            "User-Agent": "PrimeImportaProduto (contato@suaempresa.com.br)",
        },
    )

    try:
        with urllib.request.urlopen(req) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            print("\n=============================================")
            print("🎉 TOKEN GERADO COM SUCESSO! 🎉")
            print("=============================================")
            print(f"ID da Loja (User ID): {res_data.get('user_id')}")
            print(f"Access Token:         {res_data.get('access_token')}")
            print("=============================================")
            print("\nCopie os valores acima e cadastre no sistema!")
    except urllib.error.HTTPError as e:
        print(f"\n❌ Erro ao obter o token (HTTP {e.code}): {e.read().decode('utf-8')}")
    except Exception as e:
        print(f"\n❌ Ocorreu um erro: {e}")
else:
    print("❌ Falha: Não foi possível obter o código de autorização.")
