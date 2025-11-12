// PDF Conversion Tool - Convert A3 landscape to A5 booklet
const { PDFDocument } = PDFLib;

let selectedFile = null;
let convertedPdfBytes = null;

// Elements
const convertSelectBtn = document.getElementById('convert-select-btn');
const convertFileInput = document.getElementById('convert-file-input');
const convertProcessBtn = document.getElementById('convert-process-btn');
const convertDownloadBtn = document.getElementById('convert-download-btn');
const conversionStatus = document.getElementById('conversion-status');
const conversionStatusText = document.getElementById('conversion-status-text');
const skipFirstPageCheckbox = document.getElementById('skip-first-page');
const qualitySelect = document.getElementById('quality-select');

// DOM Elements
const conversionCard = document.getElementById('conversion-card');

// Event Listeners
convertSelectBtn.addEventListener('click', () => convertFileInput.click());

// Also trigger file selection when clicking the card (except on buttons/inputs)
conversionCard.addEventListener('click', (e) => {
    // Don't trigger if clicking on buttons, inputs, or select
    if (e.target.tagName !== 'BUTTON' && 
        e.target.tagName !== 'INPUT' && 
        e.target.tagName !== 'SELECT' &&
        e.target.tagName !== 'OPTION' &&
        !e.target.closest('button') &&
        !e.target.closest('select')) {
        convertFileInput.click();
    }
});

convertFileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
        handleFileSelection(file);
    }
});

// Drag & Drop handlers for conversion card
conversionCard.addEventListener('dragenter', (e) => {
    e.preventDefault();
    e.stopPropagation();
    conversionCard.style.borderColor = 'rgba(59, 130, 246, 0.8)';
    conversionCard.style.background = 'rgba(59, 130, 246, 0.2)';
});

conversionCard.addEventListener('dragleave', (e) => {
    e.preventDefault();
    e.stopPropagation();
    conversionCard.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    conversionCard.style.background = 'rgba(59, 130, 246, 0.1)';
});

conversionCard.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
});

conversionCard.addEventListener('drop', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Reset visual feedback
    conversionCard.style.borderColor = 'rgba(59, 130, 246, 0.3)';
    conversionCard.style.background = 'rgba(59, 130, 246, 0.1)';
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        const file = files[0];
        if (file.type === 'application/pdf') {
            handleFileSelection(file);
        } else {
            showStatus('❌ Veuillez glisser un fichier PDF', 'error');
        }
    }
});

// Unified file selection handler
function handleFileSelection(file) {
    selectedFile = file;
    showStatus(`📄 Fichier sélectionné: ${file.name}`, 'info');
    convertProcessBtn.style.display = 'inline-block';
    convertDownloadBtn.style.display = 'none';
    const openReaderBtn = document.getElementById('open-reader-btn');
    if (openReaderBtn) {
        openReaderBtn.style.display = 'none';
    }
}

convertProcessBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    try {
        showStatus('⏳ Conversion en cours...', 'info');
        convertProcessBtn.disabled = true;
        
        // Read the input PDF with pdf.js
        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const sourcePdf = await loadingTask.promise;
        
        const pageCount = sourcePdf.numPages;
        const skipFirstPage = skipFirstPageCheckbox.checked;
        const quality = parseFloat(qualitySelect.value);
        const startPage = skipFirstPage ? 2 : 1;
        const totalPages = skipFirstPage ? pageCount - 1 : pageCount;
        
        showStatus(`📖 Traitement de ${totalPages} pages (qualité: ${Math.round(quality * 100)}%)${skipFirstPage ? ' - première page ignorée' : ''}...`, 'info');
        
        // Create new PDF for output
        const newPdfDoc = await PDFDocument.create();
        
        // Process each page
        for (let i = startPage; i <= pageCount; i++) {
            const page = await sourcePdf.getPage(i);
            
            // Use high scale for maximum quality (4.0 = 4x resolution)
            const viewport = page.getViewport({ scale: 4.0 });
            
            const width = viewport.width;
            const height = viewport.height;
            const halfWidth = width / 2;
            
            // Get original page size in points for PDF
            const originalViewport = page.getViewport({ scale: 1.0 });
            const pdfWidth = originalViewport.width;
            const pdfHeight = originalViewport.height;
            const pdfHalfWidth = pdfWidth / 2;
            
            console.log(`Page ${i}: ${pdfWidth.toFixed(2)} x ${pdfHeight.toFixed(2)} pts (source)`);
            
            // Render full page to canvas at high resolution
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            
            // Extract left half
            const leftCanvas = document.createElement('canvas');
            leftCanvas.width = halfWidth;
            leftCanvas.height = height;
            const leftCtx = leftCanvas.getContext('2d');
            leftCtx.drawImage(canvas, 0, 0, halfWidth, height, 0, 0, halfWidth, height);
            
            // Extract right half
            const rightCanvas = document.createElement('canvas');
            rightCanvas.width = halfWidth;
            rightCanvas.height = height;
            const rightCtx = rightCanvas.getContext('2d');
            rightCtx.drawImage(canvas, halfWidth, 0, halfWidth, height, 0, 0, halfWidth, height);
            
            // Convert to JPEG with selected quality for better compression
            const leftImageData = leftCanvas.toDataURL('image/jpeg', quality);
            const leftImageBytes = await fetch(leftImageData).then(res => res.arrayBuffer());
            const leftImage = await newPdfDoc.embedJpg(leftImageBytes);
            
            // Create page with original dimensions (in points)
            const leftPage = newPdfDoc.addPage([pdfHalfWidth, pdfHeight]);
            leftPage.drawImage(leftImage, {
                x: 0,
                y: 0,
                width: pdfHalfWidth,
                height: pdfHeight,
            });
            
            // Convert right to JPEG with selected quality
            const rightImageData = rightCanvas.toDataURL('image/jpeg', quality);
            const rightImageBytes = await fetch(rightImageData).then(res => res.arrayBuffer());
            const rightImage = await newPdfDoc.embedJpg(rightImageBytes);
            
            const rightPage = newPdfDoc.addPage([pdfHalfWidth, pdfHeight]);
            rightPage.drawImage(rightImage, {
                x: 0,
                y: 0,
                width: pdfHalfWidth,
                height: pdfHeight,
            });
            
            // Update progress
            const progress = Math.round(((i - startPage + 1) / totalPages) * 100);
            showStatus(`⏳ Progression: ${progress}%`, 'info');
        }
        
        // Save the new PDF
        convertedPdfBytes = await newPdfDoc.save();
        
        const finalPageCount = totalPages * 2;
        const fileSizeMB = (convertedPdfBytes.length / 1024 / 1024).toFixed(2);
        const originalSizeMB = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2);
        const compressionRatio = ((1 - convertedPdfBytes.length / arrayBuffer.byteLength) * 100).toFixed(1);
        
        showStatus(`✅ Conversion terminée! ${finalPageCount} pages créées. Taille: ${fileSizeMB} MB (original: ${originalSizeMB} MB${compressionRatio > 0 ? ', compression: -' + compressionRatio + '%' : ''})`, 'success');
        convertProcessBtn.style.display = 'none';
        convertDownloadBtn.style.display = 'inline-block';
        
        // Show "Open in Reader" button
        const openReaderBtn = document.getElementById('open-reader-btn');
        if (openReaderBtn) {
            openReaderBtn.style.display = 'inline-block';
        }
        
        convertProcessBtn.disabled = false;
        
    } catch (error) {
        console.error('Conversion error:', error);
        showStatus(`❌ Erreur: ${error.message}`, 'error');
        convertProcessBtn.disabled = false;
    }
});

// Open converted PDF in reader
const openReaderBtn = document.getElementById('open-reader-btn');
if (openReaderBtn) {
    openReaderBtn.addEventListener('click', async () => {
        if (!convertedPdfBytes) return;
        
        const filename = selectedFile.name.replace('.pdf', '_livret_A5.pdf');
        
        // Call the reader's loadPDFFromBytes function
        if (typeof loadPDFFromBytes === 'function') {
            await loadPDFFromBytes(convertedPdfBytes, filename);
            showStatus('✅ Ouvert dans le lecteur!', 'success');
        } else {
            console.error('loadPDFFromBytes function not found');
            showStatus('❌ Erreur: Fonction non disponible', 'error');
        }
    });
}

convertDownloadBtn.addEventListener('click', () => {
    if (!convertedPdfBytes) return;
    
    // Create download link
    const blob = new Blob([convertedPdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = selectedFile.name.replace('.pdf', '_livret_A5.pdf');
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showStatus('✅ Téléchargement lancé!', 'success');
});

function showStatus(message, type) {
    conversionStatusText.textContent = message;
    conversionStatus.style.display = 'block';
    
    // Style based on type
    if (type === 'success') {
        conversionStatus.style.background = 'rgba(34, 197, 94, 0.2)';
        conversionStatus.style.border = '1px solid rgba(34, 197, 94, 0.4)';
    } else if (type === 'error') {
        conversionStatus.style.background = 'rgba(239, 68, 68, 0.2)';
        conversionStatus.style.border = '1px solid rgba(239, 68, 68, 0.4)';
    } else {
        conversionStatus.style.background = 'rgba(59, 130, 246, 0.2)';
        conversionStatus.style.border = '1px solid rgba(59, 130, 246, 0.4)';
    }
}

console.log('PDF Conversion Tool loaded');
