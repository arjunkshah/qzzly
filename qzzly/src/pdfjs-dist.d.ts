declare module "pdfjs-dist/legacy/build/pdf" {
  export * from "pdfjs-dist";
  export as namespace pdfjsLib;
}
declare module "pdfjs-dist/build/pdf.worker?url" {
  const src: string;
  export default src;
} 