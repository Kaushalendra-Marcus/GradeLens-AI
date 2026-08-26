"use client";

export type PageImage = { page: number; dataUrl: string; width: number; height: number };

export async function rasterizePdf(file: File, targetWidth = 1600): Promise<PageImage[]> {
  // Dynamic import to avoid SSR
  const pdfjsLib: any = await import("pdfjs-dist");
  // Use legacy build worker
  // pdfjs-dist v4 needs workerSrc set
  if (typeof window !== "undefined" && pdfjsLib.GlobalWorkerOptions) {
    // Use CDN worker as fallback; but we will try to use local if available
    // For simplicity use unpkg CDN via workerSrc if not already set
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }
  }

  const buf = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
  const pages: PageImage[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = targetWidth / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas context unavailable");
    await page.render({ canvasContext: ctx, viewport }).promise;

    pages.push({
      page: i,
      dataUrl: canvas.toDataURL("image/jpeg", 0.85),
      width: canvas.width,
      height: canvas.height,
    });
  }
  return pages;
}

export async function fileToPageImages(file: File): Promise<PageImage[]> {
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
  if (isPdf) {
    return rasterizePdf(file);
  }
  // Image file
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // Need dimensions
  const dims = await new Promise<{ width: number; height: number }>((resolve) => {
    const img = new Image();
    img.onload = () => resolve({ width: img.width, height: img.height });
    img.onerror = () => resolve({ width: 1600, height: 1200 });
    img.src = dataUrl;
  });

  const targetWidth = 1600;
  // If image is larger, we could resize via canvas but for now keep as-is with targetWidth meta
  // We'll render as is but report width/height scaled conceptually
  return [{ page: 1, dataUrl, width: dims.width, height: dims.height }];
}
