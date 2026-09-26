# Deploy to Cloudflare Pages

This is a static Vite application. The game uses query parameters on `/` for room invites; it has no path based routes or server function.

## If the dashboard shows `npx wrangler deploy`

That project uses **Workers Builds**, not **Pages**. Workers Builds has no **Build output directory** field. To keep this project, open **Settings → Build**, leave **Build command** as `npm run build`, and set **Deploy command** to `npx wrangler deploy --assets ./dist` so Wrangler uploads the Vite output explicitly. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` under **Build variables and secrets** on the same settings page, then retry the build. Vite needs these variables at build time; Workers runtime variables are too late for this browser bundle. See Cloudflare's [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/) and [static assets guide](https://developers.cloudflare.com/workers/static-assets/).

The Pages setup below is an alternative if you want a Pages project with a dedicated output-directory field. A green build alone does not confirm that `dist` or the Supabase build variables were included; inspect the deployment URL and test a real two-device room.

## Create the Pages project

1. Connect this Git repository in **Cloudflare → Workers & Pages → Create application → Pages**. Select the intended production branch.
2. Set **Build command** to `npm run build` and **Build output directory** to `dist`. Leave the root directory at the repository root.
3. In **Settings → Environment variables**, set the following for production (and preview, if preview multiplayer is needed):

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | The project's **public publishable** key |

4. Deploy the selected commit. Vite embeds `VITE_` variables into browser JavaScript at build time. Never enter a Supabase service role or secret key here. The older `VITE_SUPABASE_ANON_KEY` remains a local test fallback; configure `VITE_SUPABASE_PUBLISHABLE_KEY` for Pages.

Cloudflare's [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) documents the build and environment settings. The current local `.env` is ignored by Git and is not a deployment configuration.

## Prepare content

- Edit [src/content/final-wish.txt](src/content/final-wish.txt) in UTF-8, then rebuild and redeploy. The text is bundled at build time so both players see the same wish without a runtime content request.
- Memory photographs and captions are configured in [public/assets/memories/manifest.json](public/assets/memories/manifest.json). Image paths must match the exact case of files under `public/assets/memories/`. These files become public on deployment; use only photographs intended to be shared.

## Verify a deployment

1. Open `https://<your-domain>/` in two separate browsers or devices. The host creates a room; the guest opens the generated invite URL. It should have the form `https://<your-domain>/?room=<roomId>` (no localhost or port).
2. Confirm both browsers show connected Presence, move together in Phase 5, complete the Dark Zone, then proceed through the Phase 6 memory puzzle, reunion, gate, Phase 7 wish, and final black screen.
3. Refresh a player during Phase 5 and at the Phase 6 memory checkpoint to check reconnection. Refresh during Phase 7 starts the cinematic again; resuming at a precise Phase 7 beat is not supported.
4. Confirm the memory images load and the Vietnamese wish is rendered correctly. Test once on the actual HTTPS domain because Web Audio, clipboard, WebGL, and Supabase WebSocket behavior can differ from localhost.

For local production smoke testing, run `npm run build`, `npm run preview -- --host 127.0.0.1 --port 4173`, then `node scripts/smoke_production.js`.

## Roll back

In **Cloudflare Pages → Deployments → All deployments**, open the three-dot menu on the last known good production deployment and choose **Rollback to this deployment**. Cloudflare documents [deployment rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/). Confirm that its build used the expected public Supabase environment variables and test a two device invite after rollback.
