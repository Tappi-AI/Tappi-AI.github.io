# tappi.ai

Jekyll source for [tappi.ai](https://tappi.ai) — the marketing site for
Tappi, an AI-assisted table/workspace app. The flagship demo content (the
"ESG Goods Journey" pages) is drawn from the product's ESG traceability use
case in the sibling `esg-tappi` repo.

## Local development

```bash
bundle install
bundle exec jekyll serve --livereload --host 127.0.0.1 --port 14001
```

Site runs at http://localhost:14001 with livereload.

## Structure

```
_config.yml           # Jekyll site config (title, plugins, SEO)
_layouts/base.html     # Single page layout (nav, footer) — no external CDN/theme
assets/css/main.css    # Site styles
_data/esg_products.yml # Demo product data rendered on /esg-demo/
index.md               # Home
about/index.md          # About
esg-demo/index.md       # ESG Goods Journey demo
Gemfile                 # Jekyll dependencies
```

## Deployment

Auto-deploys to GitHub Pages on push to `main` via
`.github/workflows/jekyll.yml`, which installs the Gemfile dependencies, runs
`bundle exec jekyll build`, and publishes `_site/`. Custom domain is set via
`CNAME`.
