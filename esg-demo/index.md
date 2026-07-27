---
layout: base
title: ESG Goods Journey — a Tappi demo
description: >-
  See how Tappi tracks product origin, certifications, carbon footprint, and
  supply-chain path — one row per product, one table for the whole journey.
---

# ESG Goods Journey

Every row below is one product, tracked end to end in a single Tappi table:
origin, certification documents, carbon footprint, and the supply-chain path
it traveled to reach the shelf. No spreadsheet stitching, no separate PDF
archive — it's all one table with a doc attached to each row.

<div class="card-grid">
{%- for item in site.data.esg_products %}
<div class="product-card">
<div class="emoji">{{ item.emoji }}</div>
<h3>{{ item.name }}</h3>
<dl>
<dt>ISBN</dt><dd>{{ item.isbn }}</dd>
<dt>Origin</dt><dd>{{ item.origin }}</dd>
<dt>Date</dt><dd>{{ item.date }}</dd>
<dt>CO₂</dt><dd>{{ item.carbon_footprint }}</dd>
</dl>
<ul class="certs">
{%- for cert in item.certifications %}
<li>✓ {{ cert }}</li>
{%- endfor %}
</ul>
<ul class="path-steps">
{%- for p in item.path %}
<li>{{ p.emoji }} {{ p.step }}</li>
{%- endfor %}
</ul>
</div>
{%- endfor %}
</div>

## How this maps to Tappi

- **Table**: `esg` — one row per product.
- **Columns**: title, origin, date, carbon footprint, certifications (tags), supply-chain path.
- **Doc**: each row carries its own document — the certification paperwork behind the tags above.
- **Views**: a table view for the sustainability team, a timeline view to track certification renewal dates.

<a class="cta" href="{{ '/' | relative_url }}">← Back to Tappi</a>
