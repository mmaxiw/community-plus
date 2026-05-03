# Community Plus

A directory of local businesses and professionals, hosted free on GitHub Pages.

**Live site:** https://mmaxiw.github.io/community-plus/

Each listing is a single Markdown file with a photo, description, contact info, and tags. The site has full-text search and clickable tag filters.

---

## How to add a business or professional

1. Create a new file in `_businesses/`. Name it after the business in lowercase with dashes — for example `joes-pizza.md`.
2. Copy this template into the file:

   ```yaml
   ---
   name: Joe's Pizza
   category: Food & Drink
   image: https://example.com/path/to/photo.jpg
   tags: [pizza, italian, restaurant, family-owned]
   description: One-line summary that shows on the listing card.
   contact:
     phone: "+1 555 000 0000"
     email: hello@example.com
     website: https://example.com
     address: "123 Main St, Springfield"
   ---

   Longer description goes here. You can use Markdown:

   - bullet points
   - **bold** and *italics*
   - [links](https://example.com)

   ## Subheadings work too
   ```

3. Commit and push (or edit the file directly on github.com — the site rebuilds automatically within a minute or two).

All fields except `name` are optional, but adding `image`, `tags`, and `description` makes the listing much more useful in search and on the homepage.

---

## Image hosting

Two options:

- **External URL** (easiest): paste a direct image URL into the `image:` field. Free image hosts:
  - [imgur.com](https://imgur.com) — free, no account needed
  - [postimages.org](https://postimages.org) — free, no account needed
  - Unsplash photo URLs (for stock-style photos)
- **Inside the repo**: drop the image into `assets/images/` and use `image: /assets/images/joes-pizza.jpg`. This keeps everything in one place.

Recommended size: 800×500 or larger, landscape orientation works best for cards.

---

## Tags

Use the `tags:` field as a YAML array. Tags are lowercase, with dashes for multi-word tags:

```yaml
tags: [pizza, italian, family-owned, gluten-free]
```

Tags appear on each listing as clickable buttons. Clicking one filters the homepage to listings with that tag. Click multiple to narrow further.

---

## Search

The search box on the homepage matches against:

- business name
- category
- description
- tags

Clicking a tag adds it to the active filters. The URL updates as you search, so you can share a filtered view (e.g. `?#tag=plumbing`).

---

## Tech

- **Static site:** [Jekyll](https://jekyllrb.com/), built and hosted free by GitHub Pages.
- **No build step needed locally.** Push the file, GitHub builds the site.
- **No database.** Each `.md` file is a listing.
- **No external services.** Search is client-side JavaScript over the rendered HTML.

To preview locally (optional, not required to publish):

```bash
bundle install
bundle exec jekyll serve
```

---

## Contributing

Want your business listed?
1. Fork this repo, add your `.md` file in `_businesses/`, and open a pull request.
2. Or open an issue with your details and we'll add it.
