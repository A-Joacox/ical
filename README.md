# Self Grow

PWA para iPhone: calorías, gym, agenda y estado del home-server. Se instala desde Safari con
"Añadir a pantalla de inicio" y la sirve un backend Fastify en Docker, publicado con Tailscale
Funnel. La `/api` está protegida con passkey (Face ID).

```
apps/web     PWA (Vite + React + TypeScript)
apps/server  API + servidor de la PWA (Fastify, Node 24 ejecuta TypeScript directo)
data/        SQLite del server (passkeys, suscripciones push y, más adelante, el backup). No se sube a git.
```

## Desarrollo en el PC

```bash
npm install
npm run build        # compila la PWA en apps/web/dist
npm run dev:server   # sirve dist + /api en http://localhost:3000 (lee apps/server/.env si existe)
npm run dev:web      # Vite con recarga en caliente en http://localhost:5173 (proxy de /api al :3000)
npm run typecheck
npm test --workspaces
```

En local las passkeys usan `localhost`. Para registrar una, crea `apps/server/.env` con solo
`SETUP_TOKEN=<lo-que-quieras>`.

## Setup del home-server (Ubuntu, una sola vez)

1. **Que la laptop no se suspenda al cerrar la tapa.** En `/etc/systemd/logind.conf` deja:
   ```
   HandleLidSwitch=ignore
   HandleLidSwitchExternalPower=ignore
   HandleLidSwitchDocked=ignore
   ```
   y luego `sudo systemctl restart systemd-logind`.
2. **Configuración:** `cp apps/server/.env.example apps/server/.env` y rellénalo (dominio, secretos).
3. **Levantar la app** (también arranca Glances, que lee las métricas del host):
   ```bash
   docker compose up -d --build
   curl http://localhost:3000/api/health
   ```
4. **Notificaciones push:** genera las claves VAPID, pégalas en `.env` y reinicia:
   ```bash
   docker compose run --rm --no-deps app node -e "console.log(require('web-push').generateVAPIDKeys())"
   docker compose up -d
   ```
   Opcional: para ver la temperatura de la GPU NVIDIA, instala `nvidia-container-toolkit` y
   descomenta el bloque `deploy` del servicio `glances` en `docker-compose.yml`.
5. **Publicarla con Funnel** en la raíz del 443 (la ruta `/webhook` de n8n sigue en el mismo puerto):
   ```bash
   sudo tailscale funnel --bg 3000
   tailscale funnel status
   ```

Para actualizar después de cada cambio: `./deploy.sh` (hace `git pull` y reconstruye el contenedor).

## Instalar en el iPhone

1. Abre `https://<host>.<tailnet>.ts.net` en Safari → Compartir → **Añadir a pantalla de inicio**.
2. Abre la app desde el ícono, escribe el `SETUP_TOKEN` y toca **Registrar este iPhone**. La passkey
   se guarda en el Llavero de iCloud. Las siguientes veces se entra con **Face ID**.
3. Opcional: borra `SETUP_TOKEN` del `.env` y reinicia (`docker compose up -d`) para que nadie más
   pueda registrar dispositivos.
4. Prueba offline: con la app abierta una vez, activa el modo avión y vuelve a abrirla.
5. Notificaciones: Ajustes → **Activar notificaciones** → **Enviar notificación de prueba**.
