/// <reference types="vite/client" />

// Allow importing CSS files with ?inline suffix
declare module '*.css?inline' {
  const content: string;
  export default content;
}
