# OPAL Kaneo plugin

Syncs OPAL issues and work orders with tasks in [Kaneo](https://github.com/usekaneo/kaneo).

- Each issue in a mapped OPAL project gets a Kaneo task. Title, column, priority and comments
  sync both ways. OPAL keeps its rules: a Kaneo move that OPAL refuses goes back, with a comment
  that gives the reason.
- Each work order in a mapped OPAL project gets a task in a second Kaneo project. OPAL sets its
  title, column and priority. Comments sync both ways.

## Install

In OPAL, open Settings > Plugins and add this repository. Then set:

| Setting | Value |
|---|---|
| Kaneo URL | `https://kaneo.example.com` |
| API key | Kaneo > Settings > Account > API Keys |
| Issue projects | a Kaneo project for each OPAL project, from a dropdown once the plugin runs |
| Work order projects | the same, for work orders |
| Status columns | optional: `{ "issue": { "in_review": "review" }, "workOrder": { ... } }` |
| OPAL public URL | an OPAL address Kaneo can reach. Needed for webhooks and task links. |
| Webhook secret | any random string. With the public URL, the plugin sets the webhook on each mapped Kaneo project. |

Without webhooks, the plugin polls Kaneo every 5 minutes.

The plugin sets the webhook with Kaneo's "create or replace" call, so it replaces any generic
webhook that a mapped Kaneo project has.

## Develop

This repository builds against a checkout of OPAL next to it (`../../OPAL`).

```bash
pnpm install
pnpm test
pnpm check
pnpm build        # writes dist/plugin.js; commit it, OPAL runs that file
```

For a local install, start OPAL with `OPAL_PLUGINS_LOCAL=1` and add `local:/abs/path/to/kaneo`.
