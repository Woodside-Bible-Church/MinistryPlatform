# Ministry Platform Projects

This repository contains all internal projects, customizations, and integrations related to [MinistryPlatform](https://ministryplatform.com/), organized by type and usage.

> Maintained by: Colton Wirgau  
> Organization: Woodside Bible Church

---

## 📂 Folder Structure

### `NextJS/`
Full-stack applications and standalone tools built with [Next.js](https://nextjs.org/).  
Each subfolder is an isolated app with its own dependencies and config.

Example:
- `MPNext/` – NextJS wrapper for MP Authentication
- `VolunteerPortal/` – Dashboard or admin tool

---

### `CustomWidgets/`
Self-contained JavaScript widgets that run on MinistryPlatform pages or external websites.  
Ideal for interactive components like sermon lists, menus, and filtering tools.

Example:
- `GroupFinder/`
- `SermonSeries/`

---

### `MPWidgets/`
Custom CSS and JavaScript used to style or enhance **MinistryPlatform’s built-in widgets**.  
This includes overrides, layout tweaks, or minor behavioral adjustments.

Subfolders:
- `Styles/` – Widget-specific CSS (e.g., `group-finder.css`)
- `Scripts/` – Widget enhancements and JS utilities

---

## 🛠️ Contributing

This repo is maintained internally. If you’re working on a widget or app:
1. Create a subfolder in the appropriate section
2. Add a `README.md` explaining the purpose of your tool
3. Follow consistent naming and modular structure

---

## 📌 Notes

- This repo assumes access to private MinistryPlatform APIs
- Code may reference MinistryPlatform-specific terms like `dp_` or `Event_ID`
- Styling follows the Woodside branding (`#61BC47` green) when relevant

---

## 🔒 Access

This repo contains integrations with private systems. Access is limited to internal development.

---
