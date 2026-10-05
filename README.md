# Self Grow

PWA para iPhone: calorías, gym, agenda y estado del home-server. Se instala desde Safari con
"Añadir a pantalla de inicio" y la sirve un backend Fastify en Docker, publicado solo dentro de
tu red Tailscale.

```
apps/web     PWA (Vite + React + TypeScript)
apps/server  API + servidor de la PWA (Fastify, Node 24 ejecuta TypeScript directo)
```

## Desarrollo en el PC

```bash
npm install
npm run build        # compila la PWA en apps/web/dist
npm run dev:server   # sirve dist + /api en http://localhost:3000
npm run dev:web      # Vite con recarga en caliente en http://localhost:5173 (proxy de /api al :3000)
npm run typecheck
```

## Setup del home-server (Ubuntu, una sola vez)

1. **Que la laptop no se suspenda al cerrar la tapa.** En `/etc/systemd/logind.conf` deja:
   ```
   HandleLidSwitch=ignore
   HandleLidSwitchExternalPower=ignore
   HandleLidSwitchDocked=ignore
   ```
   y luego `sudo systemctl restart systemd-logind`.
2. **Tailscale:** en la consola de administración (DNS) activa **MagicDNS** y **HTTPS Certificates**.
3. **Levantar la app:**
   ```bash
   git clone <url-del-repo> self-grow-app && cd self-grow-app
   docker compose up -d --build
   curl http://localhost:3000/api/health
   ```
4. **Publicarla con HTTPS en tu tailnet** (no queda expuesta a internet):
   ```bash
   sudo tailscale serve --bg 3000
   tailscale serve status   # muestra la URL https://<host>.<tailnet>.ts.net
   ```

Para actualizar después de cada cambio: `./deploy.sh` (hace `git pull` y reconstruye el contenedor).

## Instalar en el iPhone

1. Instala **Tailscale**, inicia sesión con la misma cuenta y activa *VPN On Demand*.
2. Abre la URL `https://<host>.<tailnet>.ts.net` en Safari → Compartir → **Añadir a pantalla de inicio**
   (con "Abrir como app web" activado).
3. Prueba: abre la app una vez, activa el modo avión y vuelve a abrirla. Debe cargar y mostrar
   "Server sin conexión (modo offline)".
