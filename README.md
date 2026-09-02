# Personal Portfolio

A personal portfolio website for a developer — a single-page site with animations, project showcases, and a contact form.


## Tech Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**
- **GSAP** + **ScrollTrigger** — scroll-based animations
- **Lenis** — smooth scrolling
- **Zod** — server-side form validation
- **Vite / vinext** — build tooling and local dev
- Deployment: **Cloudflare Workers** (via `wrangler`)

## Features

- Responsive hero section with video background
- Skills/disciplines block (Frontend, Backend, AI systems, Product development)
- Project gallery with video previews (adapts to device performance — reduced motion, slow connections, touch screens)
- Contact form with spam protection: origin check, honeypot field, rate limiting (3 requests/hour), cookie-based cooldown
- Email delivery via [Formspree](https://formspree.io)

## Getting Started

Requires Node.js `>= 22.13.0`.

```bash
# install dependencies
pnpm install

# start dev server
pnpm run dev

# build for production
pnpm run build

# run production build locally
pnpm run start
```

## Available Scripts

| Command | Description |
|---|---|
| `pnpm run dev` | Start local development |
| `pnpm run build` | Production build |
| `pnpm run start` | Run the build |
| `pnpm run lint` | Lint the codebase |
| `pnpm test` | Build + rendered HTML smoke test |

## Project Structure

```
app/
  ├─ page.tsx               # main page (hero, projects, contact form)
  ├─ layout.tsx              # root layout
  ├─ globals.css              # global styles
  └─ api/contact/route.ts       # contact form API endpoint
public/
  ├─ media/                  # project videos and posters
  └─ projects/                 # project preview images
worker/index.ts                # Cloudflare Workers entry point
```

## Environment

The contact form sends submissions through Formspree — the endpoint is set directly in `app/api/contact/route.ts`. Move it to an environment variable if needed.

## Author

**Artur Tymoshenko**
Full-Stack Developer · Vienna, Austria
📧 tymoshenkoarturx@gmail.com
