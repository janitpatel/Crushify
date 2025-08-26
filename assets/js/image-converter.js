// Modular Image Converter for Client-side Bulk Conversion
// Requirements: HEIC (heic2any), PDF (pdf.js), canvas conversion, preview, download (single/zip)

// External libraries assumed loaded: heic2any, pdf.js, JSZip, FileSaver

const SUPPORTED_INPUTS = ["jpg", "jpeg", "png", "webp", "bmp", "gif", "heic", "pdf", "svg"];
const OUTPUTS = ["jpg", "png", "pdf"];

// Utility: Get file extension
function getExtension(filename) {
  return filename.split('.').pop().toLowerCase();
}

// Utility: Convert canvas to Blob
function canvasToBlob(canvas, type = "image/png", quality = 0.92) {
  return new Promise(resolve => canvas.toBlob(resolve, type, quality));
}

// Convert HEIC to canvas
async function heicToCanvas(file) {
  const blob = await heic2any({ blob: file, toType: "image/jpeg" });
  return await imageToCanvas(blob);
}

// Convert PDF to array of canvases (one per page)
async function pdfToCanvases(file) {
  const pdfjsLib = window['pdfjsLib'];
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const canvases = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    await page.render({ canvasContext: ctx, viewport }).promise;
    canvases.push(canvas);
  }
  return canvases;
}

// Convert image file (blob) to canvas
function imageToCanvas(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = function () {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext('2d').drawImage(img, 0, 0);
      resolve(canvas);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Convert SVG file to canvas
async function svgToCanvas(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const svgText = e.target.result;
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        canvas.getContext('2d').drawImage(img, 0, 0);
        resolve(canvas);
      };
      img.onerror = reject;
      // Use data URI for SVG
      img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgText);
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

// Main conversion function
async function convertFiles(files, outputType = "jpg") {
  const results = [];
  if (outputType === "pdf") {
    // Convert all images to canvases, then add to PDF
    const jsPDF = window.jspdf?.jsPDF || window.jsPDF;
    if (!jsPDF) throw new Error("jsPDF library not loaded");
    const pdf = new jsPDF();
    for (let idx = 0; idx < files.length; idx++) {
      const file = files[idx];
      const ext = getExtension(file.name);
      let canvas;
      if (ext === "heic") {
        canvas = await heicToCanvas(file);
      } else if (ext === "svg") {
        canvas = await svgToCanvas(file);
      } else if (SUPPORTED_INPUTS.includes(ext) && ext !== "pdf") {
        canvas = await imageToCanvas(file);
      } else {
        continue;
      }
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20; // px
      let imgWidth = canvas.width;
      let imgHeight = canvas.height;
      // Scale image to fit page, preserving aspect ratio and margin
      const ratio = Math.min((pageWidth - 2 * margin) / imgWidth, (pageHeight - 2 * margin) / imgHeight);
      imgWidth *= ratio;
      imgHeight *= ratio;
      const x = (pageWidth - imgWidth) / 2;
      const y = (pageHeight - imgHeight) / 2;
      pdf.addImage(imgData, "JPEG", x, y, imgWidth, imgHeight);
      if (idx < files.length - 1) pdf.addPage();
    }
    const pdfBlob = pdf.output("blob");
    results.push({
      name: `converted.pdf`,
      blob: pdfBlob,
      url: URL.createObjectURL(pdfBlob),
      canvas: null
    });
    return results;
  } else {
    for (const file of files) {
      const ext = getExtension(file.name);
      let canvases = [];
      if (ext === "heic") {
        canvases = [await heicToCanvas(file)];
      } else if (ext === "pdf") {
        canvases = await pdfToCanvases(file);
      } else if (ext === "svg") {
        canvases = [await svgToCanvas(file)];
      } else if (SUPPORTED_INPUTS.includes(ext)) {
        canvases = [await imageToCanvas(file)];
      } else {
        continue; // skip unsupported
      }
      for (let i = 0; i < canvases.length; i++) {
        const canvas = canvases[i];
        const mime = outputType === "png" ? "image/png" : "image/jpeg";
        const blob = await canvasToBlob(canvas, mime, 0.92);
        results.push({
          name: `${file.name.replace(/\.[^.]+$/, '')}${canvases.length > 1 ? `_p${i+1}` : ''}.${outputType}`,
          blob,
          url: URL.createObjectURL(blob),
          canvas
        });
      }
    }
    return results;
  }
}

// Preview rendering
function renderPreviews(results, container) {
  container.innerHTML = "";
  results.forEach(res => {
    const card = document.createElement("div");
    card.className = "image__card";
    const img = document.createElement("img");
    img.src = res.url;
    img.alt = res.name;
    const info = document.createElement("p");
    info.textContent = res.name;
    const dlBtn = document.createElement("a");
    dlBtn.href = res.url;
    dlBtn.download = res.name;
    dlBtn.className = "download-btn";
    dlBtn.textContent = "Download";
    card.appendChild(img);
    card.appendChild(info);
    card.appendChild(dlBtn);
    container.appendChild(card);
  });
}

// Bulk ZIP download
async function downloadAsZip(results) {
  const zip = new JSZip();
  results.forEach(res => zip.file(res.name, res.blob));
  const blob = await zip.generateAsync({ type: "blob" });
  saveAs(blob, "converted_images.zip");
}

// Exported API
window.ImageConverter = {
  SUPPORTED_INPUTS,
  OUTPUTS,
  convertFiles,
  renderPreviews,
  downloadAsZip
};

//# sourceMappingURL=image-converter.js.map
