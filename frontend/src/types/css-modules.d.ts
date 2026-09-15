/** CSS Modules typing for web-only components (e.g. `animated-icon.web.tsx`). */
declare module '*.module.css' {
  const classes: { readonly [className: string]: string };
  export default classes;
}
