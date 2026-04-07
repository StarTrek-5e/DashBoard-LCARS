# LCARS Dashboard - Git Ready

This build is ready for GitHub and Fly.io.

## Protected pages
- `/control.html` uses HTTP Basic Auth
- `/engineer.html` uses HTTP Basic Auth
- `/display.html` is public

## Default passwords
- Control password: `meridian-control`
- Engineer password: `meridian-engineering`

## Change passwords
Use environment variables:
- `CONTROL_PASSWORD`
- `ENGINEER_PASSWORD`

Fly.io:
```bash
flyctl secrets set CONTROL_PASSWORD="your-control-password" ENGINEER_PASSWORD="your-engineer-password"
```

## Local run
Install once:
```bash
npm install
```

Run:
```bash
npm start
```

Then open:
- `http://localhost:3000/display.html`
- `http://localhost:3000/control.html`
- `http://localhost:3000/engineer.html`

For the protected pages:
- Username can be anything
- Password must match the configured password
