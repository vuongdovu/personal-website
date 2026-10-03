## This is my personal website

currently the plan is to have a gallery of my favorite photos. For each photo that I have in the gallery it is connected to a database of meta data for the pictures. 

An agent that I build will have a tool that will allow it to query the meta data for the pictures in order for it to answer the question for the user.
 - You can make the agent control page redirects using a tool that will push the url to a nextjs api and the api will control the app in the browser

The agent is meant to be a version of me that knows everything about these memories to explain and describe them to the user.

The website should have an easy photo upload request for people that want to upload a memory into my website and I will have to approve it

I also want to build out an interface for me to easily upload pictues to the website and fill in all of it's meta data easily too and I should be able to update meta data too through an admin route in my website

maybe host minio on tailnet and use it to store pictures instead of aws and serve it through tailscle gateway

## Private archive admin

The admin app in `admin/` uploads JPEG, PNG, or WebP files (up to 20 MB) to MinIO and stores their metadata in Postgres. FastAPI serves both the HTML interface and its API. The `admin-tailscale` sidecar is the only network entry point: `admin/tailscale/config/service.json` configures Tailnet-only HTTPS on port 443 and proxies it to the admin process on loopback port 8000. Funnel is explicitly disabled, no host port is published, and the public nginx service does not route to the admin.

### First deployment

1. Enable MagicDNS and HTTPS certificates in the Tailscale DNS settings.
2. Configure the tailnet access policy so only your identity can reach the `archive-admin` node on TCP 443. The admin node must also be allowed to reach Postgres on TCP 5432 and the MinIO S3 endpoint on its configured port.
3. Use the existing private MinIO bucket named `archive-imgs` (or change `MINIO_BUCKET`) and a dedicated access key limited to that bucket. Set `MINIO_ENDPOINT=minio.tail877c9f.ts.net:8443`; port 443 serves the Console, while the S3 API is on HTTPS port 8443.
4. Generate a fresh, non-ephemeral Tailscale auth key. Copy `.env.example` to `.env`, fill in the database, MinIO, and `TS_AUTH_KEY` values, and never commit `.env`. If a value contains `$`, enclose the entire value in single quotes so Docker Compose does not interpolate it.
5. Build and start both parts of the private admin service:

   ```bash
   docker compose --profile admin up -d --build admin admin-tailscale
   ```

6. Confirm that the sidecar joined the tailnet and loaded `service.json`:

   ```bash
   docker compose --profile admin ps
   docker exec vuongdovu.com-admin-ts tailscale status
   docker exec vuongdovu.com-admin-ts tailscale serve status
   ```

7. Open the HTTPS URL reported by `tailscale serve status` from a device in your tailnet. Use Tailscale Serve only; do not enable Funnel for the admin.

The named `admin_tailscale_state` volume preserves the node identity across container rebuilds. Do not remove that volume unless you intend to register a new Tailnet node. The admin must be able to resolve and connect to both `DB_HOST` and `MINIO_ENDPOINT`; check those from inside `gallery-admin` if listing or uploads fail.


to update registry image:
docker compose build --no-cache --push next-app