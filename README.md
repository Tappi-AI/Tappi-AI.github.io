# tappi.ai

Jekyll source for [tappi.ai](https://tappi.ai) — the marketing site for
Tappi, an AI-assisted table/workspace app. The flagship demo content (the
"ESG Goods Journey" pages) is drawn from the product's ESG traceability use
case in the sibling `esg-tappi` repo.

## Local development

```bash
docker compose up site
```

Site runs at http://localhost:14001 with livereload.

Without Docker, if you have Ruby + Bundler installed:

```bash
bundle install
bundle exec jekyll serve
```

## Structure

```
_config.yml           # Jekyll site config (title, plugins, SEO)
_layouts/base.html     # Single page layout (nav, footer) — no external CDN/theme
assets/css/main.css    # Site styles
_data/esg_products.yml # Demo product data rendered on /esg-demo/
index.md               # Home
about/index.md          # About
esg-demo/index.md       # ESG Goods Journey demo
Dockerfile, Gemfile     # Jekyll build environment
```

## Deployment

Auto-deploys to GitHub Pages on push to `main` via
`.github/workflows/jekyll.yml`, which builds this repo with the `Dockerfile`
above and publishes `_site/`. Custom domain is set via `CNAME`.
