# TODO

## Infrastructure

- [ ] **Expose Seerr externally via Cloudflare Tunnel + Access**
  - Install `cloudflared` on Windows host
  - Create tunnel pointing to `localhost:5055`
  - Add Cloudflare Access policy for authentication
  - No ports need to be opened on the router
  - Radarr and Sonarr stay internal only — Seerr talks to them on the LAN
