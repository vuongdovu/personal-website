## This is my personal website

currently the plan is to have a gallery of my favorite photos. For each photo that I have in the gallery it is connected to a database of meta data for the pictures. 

An agent that I build will have a tool that will allow it to query the meta data for the pictures in order for it to answer the question for the user.
 - You can make the agent control page redirects using a tool that will push the url to a nextjs api and the api will control the app in the browser

The agent is meant to be a version of me that knows everything about these memories to explain and describe them to the user.

The website should have an easy photo upload request for people that want to upload a memory into my website and I will have to approve it

I also want to build out an interface for me to easily upload pictues to the website and fill in all of it's meta data easily too and I should be able to update meta data too through an admin route in my website

maybe host minio on tailnet and use it to store pictures instead of aws and serve it through tailscle gateway

## Private archive admin

The admin app in `admin/` uploads JPEG, PNG, or WebP files (up to 20 MB) to MinIO and writes their metadata to the `photos` table in the same Postgres service available to Next.js. It lists images currently in the bucket, shows database records whose images are missing, and can delete an image and its metadata. Postgres stores the MinIO object key, not a temporary signed URL. The admin UI is separate from the public Next.js site and is bound to `127.0.0.1:8001` on the EC2 host.

1. Install Tailscale on the EC2 host and join your tailnet. Confirm that the host can reach the **MinIO S3 API** at `https://minio.tail877c9f.ts.net/`. If that address opens only the MinIO Console, set `MINIO_ENDPOINT` to the S3 API hostname instead. The value is a hostname with an optional port, without `https://`.
2. Create a private MinIO bucket named `photos` (or set `MINIO_BUCKET`). Create a dedicated access key with permission to put and remove objects in that bucket.
3. Copy `.env.example` to `.env` and fill in the Postgres password and MinIO credentials. Do not commit `.env`. For an existing Postgres volume, changing `POSTGRES_PASSWORD` in `.env` does **not** change the database password stored in that volume.
4. Run `docker compose up -d --build db admin`. For a fresh Postgres volume, `db/init.sql` is applied automatically. For an existing volume with no `photos` table, apply it once with `docker compose exec -T db psql -U postgres -d postgres -f /docker-entrypoint-initdb.d/init.sql`. Check for an existing table before doing this; this file is an initial schema, not a migration.
5. On the EC2 host, run `tailscale serve 8001`. Open the HTTPS URL shown by Tailscale from a device on your tailnet. Use Tailscale's access policy to allow only your user account to reach the EC2 device's Serve port. Do not use Tailscale Funnel for this admin UI.

The admin container must be able to resolve and connect to the MinIO tailnet hostname. Check this from inside the container if uploads or the post list fail; Docker DNS and host Tailscale settings can differ. The public archive reads images from the bucket, joins their database dates, and displays 10 photos per page.
