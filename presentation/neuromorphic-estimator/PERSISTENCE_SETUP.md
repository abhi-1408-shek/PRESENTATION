# Persistent Render setup

The estimator now keeps its enrolled profile in PostgreSQL so that training on
the admin panel is immediately available to the audience panel and survives a
service restart.

## What to create in Render

1. Create a **PostgreSQL** service in the same Render project and region as the
   Flask web service.
2. In the web service's Environment settings, add:
   - `DATABASE_URL`: the database's **Internal Database URL**.
   - `ADMIN_TOKEN`: a long private token used only on `/admin` for training and reset.
   - `IP_HMAC_KEY`: a different long random secret used to hash the enrolled IP.
   - `TRUSTED_PROXY_HOPS=1`.
3. Keep the existing build command: `pip install -r requirements.txt`.
4. Keep the existing start command: `gunicorn app:app --bind 0.0.0.0:$PORT --workers 1 --timeout 120`.

The application creates its table automatically at startup. Do not put any of
these values in Git or expose the admin token in the audience panel.

## Seminar flow

1. Open `/admin`, enter the admin token, and type the exact phrase three times.
2. The third sample trains and saves the profile in PostgreSQL.
3. Refresh an already-open audience page, or wait up to five seconds for its
   readiness indicator to update.
4. Every audience authentication request reads the latest saved profile:
   - different IP: denied;
   - same IP but wrong phrase or behavior: denied;
   - same IP plus matching behavior: granted.

For local development without `DATABASE_URL`, the profile is stored in
`instance/estimator.db`.
