# Deploy to Cloudflare Pages

This is a Vite application with Cloudflare Pages Functions under `functions/api/personal/`. The game uses query parameters on `/` for room invites. The personal photos and letter are served only by the PIN-protected Pages Functions from a private R2 bucket.

## Configure the Pages project

1. Open the existing **Cloudflare → Workers & Pages → 5canhsao** project, connected to this Git repository. Its production branch is `main`.
2. Set **Build command** to `npm run build` and **Build output directory** to `dist`. Leave the root directory at the repository root.
3. In **Settings → Environment variables**, set the following for production (and preview, if preview multiplayer is needed):

   | Name | Value |
   | --- | --- |
   | `VITE_SUPABASE_URL` | Your Supabase project URL |
   | `VITE_SUPABASE_PUBLISHABLE_KEY` | The project's **public publishable** key |

4. Deploy the selected commit. Vite embeds `VITE_` variables into browser JavaScript at build time. Never enter a Supabase service role or secret key here. The older `VITE_SUPABASE_ANON_KEY` remains a supported public-key fallback.

Cloudflare's [Pages build configuration](https://developers.cloudflare.com/pages/configuration/build-configuration/) documents the build and environment settings. The current local `.env` is ignored by Git and is not a deployment configuration.

## Prepare content

- Public visitors use the four SVG illustrations in [public/assets/memories/manifest.json](public/assets/memories/manifest.json) and the generic text in [src/content/default-wish.ts](src/content/default-wish.ts).
- Follow [PERSONAL_CONTENT_SETUP.md](PERSONAL_CONTENT_SETUP.md) to upload the real photographs and personal letter to a private R2 bucket, bind it to Pages as `PERSONAL_CONTENT`, and set the encrypted `PERSONAL_PIN` and `PERSONAL_SESSION_SECRET` secrets. Never copy private content into `public/`, a `VITE_` variable, or a Git commit.

## Verify a deployment

1. Open `https://<your-domain>/` in two separate browsers or devices. The host creates a room; the guest opens the generated invite URL. It should have the form `https://<your-domain>/?room=<roomId>` (no localhost or port).
2. Confirm both browsers show connected Presence, move together in Phase 5, complete the Dark Zone, then proceed through the Phase 6 memory puzzle, reunion, gate, Phase 7 wish, and final black screen.
3. Refresh a player during Phase 5 and at the Phase 6 memory checkpoint to check reconnection. Refresh during Phase 7 starts the cinematic again; resuming at a precise Phase 7 beat is not supported.
4. Confirm guest mode shows SVG illustrations and the generic Vietnamese wish. In a separate private browsing session, verify that an incorrect PIN is rejected and a correct PIN loads the personal photos and letter. An unauthenticated request to `/api/personal/letter` must return HTTP 401. Test once on the actual HTTPS domain because Web Audio, clipboard, WebGL, and Supabase WebSocket behavior can differ from localhost.

For local production smoke testing, run `npm run build`, `npm run preview -- --host 127.0.0.1 --port 4173`, then `node scripts/smoke_production.js`.

## Roll back

In **Cloudflare Pages → Deployments → All deployments**, open the three-dot menu on the last known good production deployment and choose **Rollback to this deployment**. Cloudflare documents [deployment rollbacks](https://developers.cloudflare.com/pages/configuration/rollbacks/). Confirm that its build used the expected public Supabase environment variables and test a two device invite after rollback.
