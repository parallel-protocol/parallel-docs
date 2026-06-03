/*
 * Vocs v2 layout-slots convention (`src/pages/_slots.tsx`).
 *
 * Parallel uses the NATIVE v2 footer template (edit-link + prev/next
 * pagination) plus `socials` icons and resource links in the top nav — all
 * configured in `vocs.config.ts`. We export NO custom `Footer` slot here. The
 * build-time `IMPORT_IS_UNDEFINED` warnings on `OutlineFooter`/`SidebarHeader`
 * are expected and benign.
 */
export {};
