// PDF Conversion Tool - Convert A3 landscape to A5 booklet
const { PDFDocument } = PDFLib;

let selectedFile = null;
let convertedPdfBytes = null;

// ==========================================
// DEBUG LOGGING SYSTEM (same as admin.js)
// ==========================================
const DEBUG_CONVERTER = {
    enabled: true,
    levels: {
        INFO: '🔵',
        SUCCESS: '✅',
        WARNING: '⚠️',
        ERROR: '❌',
        DEBUG: '🔍',
        PERF: '⏱️'
    },
    
    log: function(level, category, message, data = null) {
        if (!this.enabled) return;
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const icon = this.levels[level] || '📝';
        const logMessage = `${icon} [${timestamp}] [${category}] ${message}`;
        
        if (data !== null) {
            console.log(logMessage, data);
        } else {
            console.log(logMessage);
        }
    },
    
    startTimer: function(label) {
        if (!this.enabled) return;
        console.time(`⏱️ ${label}`);
    },
    
    endTimer: function(label) {
        if (!this.enabled) return;
        console.timeEnd(`⏱️ ${label}`);
    },
    
    group: function(title) {
        if (!this.enabled) return;
        console.group(title);
    },
    
    groupEnd: function() {
        if (!this.enabled) return;
        console.groupEnd();
    }
};

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

/**
 * Split PDF pages conditionally based on user options
 * @param {Object} sourcePdf - PDF.js document object
 * @param {Object} options - Split options
 * @param {string} options.pageFormat - 'single' or 'double'
 * @param {boolean} options.removeFirstLeft - Remove left part of first page (only if double)
 * @param {boolean} options.skipFirstPage - Skip entire first page
 * @param {number} options.quality - JPEG quality (0.1 to 1.0)
 * @returns {Object} { pdfDoc: PDFDocument, stats: Object }
 */
async function splitPDFPages(sourcePdf, options = {}) {
    DEBUG_CONVERTER.group('📄 SPLIT PDF PAGES');
    DEBUG_CONVERTER.startTimer('Total Split Duration');
    
    const {
        pageFormat = 'double',
        removeFirstLeft = false,
        skipFirstPage = false,
        quality = 0.9
    } = options;
    
    DEBUG_CONVERTER.log('INFO', 'SPLIT_OPTIONS', 'Configuration', {
        pageFormat,
        removeFirstLeft,
        skipFirstPage,
        quality,
        totalPages: sourcePdf.numPages
    });
    
    const pageCount = sourcePdf.numPages;
    const startPage = skipFirstPage ? 2 : 1;
    const totalPages = skipFirstPage ? pageCount - 1 : pageCount;
    
    // Create new PDF for output
    const newPdfDoc = await PDFDocument.create();
    
    let processedPages = 0;
    let skippedFirstLeft = false;
    
    // Process each page
    for (let i = startPage; i <= pageCount; i++) {
        DEBUG_CONVERTER.group(`📄 Page ${i}/${pageCount}`);
        DEBUG_CONVERTER.startTimer(`Page ${i} Processing`);
        
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
        
        DEBUG_CONVERTER.log('DEBUG', 'PAGE_DIMENSIONS', `Page ${i}`, {
            renderWidth: width,
            renderHeight: height,
            pdfWidth: pdfWidth.toFixed(2),
            pdfHeight: pdfHeight.toFixed(2),
            pdfHalfWidth: pdfHalfWidth.toFixed(2)
        });
        
        // Render full page to canvas at high resolution
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        DEBUG_CONVERTER.startTimer(`Page ${i} Render`);
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
        DEBUG_CONVERTER.endTimer(`Page ${i} Render`);
        
        // CONDITIONAL SPLIT LOGIC
        if (pageFormat === 'single') {
            // NO SPLIT - Keep page as is
            DEBUG_CONVERTER.log('INFO', 'NO_SPLIT', `Page ${i} kept as single page`, null);
            
            const imageData = canvas.toDataURL('image/jpeg', quality);
            const imageBytes = await fetch(imageData).then(res => res.arrayBuffer());
            const image = await newPdfDoc.embedJpg(imageBytes);
            
            const newPage = newPdfDoc.addPage([pdfWidth, pdfHeight]);
            newPage.drawImage(image, {
                x: 0,
                y: 0,
                width: pdfWidth,
                height: pdfHeight,
            });
            
            processedPages += 1;
            
        } else if (pageFormat === 'double') {
            // SPLIT INTO TWO PAGES
            DEBUG_CONVERTER.log('INFO', 'SPLIT_MODE', `Page ${i} splitting into 2 halves`, {
                firstPage: i === startPage,
                removeFirstLeft: removeFirstLeft && i === startPage
            });
            
            // Check if we should skip left half of first page
            const shouldSkipLeft = (i === startPage && removeFirstLeft);
            
            if (shouldSkipLeft) {
                DEBUG_CONVERTER.log('WARNING', 'SKIP_FIRST_LEFT', `Skipping LEFT half of page ${i}`, null);
                skippedFirstLeft = true;
            }
            
            // Extract left half (unless skipped)
            if (!shouldSkipLeft) {
                DEBUG_CONVERTER.startTimer(`Page ${i} Left Half`);
                
                const leftCanvas = document.createElement('canvas');
                leftCanvas.width = halfWidth;
                leftCanvas.height = height;
                const leftCtx = leftCanvas.getContext('2d');
                leftCtx.drawImage(canvas, 0, 0, halfWidth, height, 0, 0, halfWidth, height);
                
                const leftImageData = leftCanvas.toDataURL('image/jpeg', quality);
                const leftImageBytes = await fetch(leftImageData).then(res => res.arrayBuffer());
                const leftImage = await newPdfDoc.embedJpg(leftImageBytes);
                
                const leftPage = newPdfDoc.addPage([pdfHalfWidth, pdfHeight]);
                leftPage.drawImage(leftImage, {
                    x: 0,
                    y: 0,
                    width: pdfHalfWidth,
                    height: pdfHeight,
                });
                
                processedPages += 1;
                DEBUG_CONVERTER.endTimer(`Page ${i} Left Half`);
                DEBUG_CONVERTER.log('SUCCESS', 'LEFT_HALF', `Page ${i} left half created`, null);
            }
            
            // Extract right half (always)
            DEBUG_CONVERTER.startTimer(`Page ${i} Right Half`);
            
            const rightCanvas = document.createElement('canvas');
            rightCanvas.width = halfWidth;
            rightCanvas.height = height;
            const rightCtx = rightCanvas.getContext('2d');
            rightCtx.drawImage(canvas, halfWidth, 0, halfWidth, height, 0, 0, halfWidth, height);
            
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
            
            processedPages += 1;
            DEBUG_CONVERTER.endTimer(`Page ${i} Right Half`);
            DEBUG_CONVERTER.log('SUCCESS', 'RIGHT_HALF', `Page ${i} right half created`, null);
        }
        
        DEBUG_CONVERTER.endTimer(`Page ${i} Processing`);
        DEBUG_CONVERTER.groupEnd();
        
        // Update progress callback if provided
        const progress = Math.round(((i - startPage + 1) / totalPages) * 100);
        if (options.progressCallback) {
            options.progressCallback(progress, i, totalPages);
        }
    }
    
    DEBUG_CONVERTER.endTimer('Total Split Duration');
    
    const stats = {
        sourcePages: pageCount,
        processedPages: totalPages,
        outputPages: processedPages,
        skippedFirstPage: skipFirstPage,
        skippedFirstLeft: skippedFirstLeft,
        pageFormat: pageFormat,
        quality: quality
    };
    
    DEBUG_CONVERTER.log('SUCCESS', 'SPLIT_COMPLETE', 'PDF split completed', stats);
    DEBUG_CONVERTER.groupEnd();
    
    return { pdfDoc: newPdfDoc, stats };
}

convertProcessBtn.addEventListener('click', async () => {
    if (!selectedFile) return;
    
    try {
        showStatus('⏳ Conversion en cours...', 'info');
        convertProcessBtn.disabled = true;
        
        DEBUG_CONVERTER.group('🔧 CONVERTER PROCESS START');
        DEBUG_CONVERTER.log('INFO', 'FILE_INFO', 'Selected file', {
            name: selectedFile.name,
            size: (selectedFile.size / 1024 / 1024).toFixed(2) + ' MB',
            type: selectedFile.type
        });
        
        // Read the input PDF with pdf.js
        const arrayBuffer = await selectedFile.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const sourcePdf = await loadingTask.promise;
        
        const pageCount = sourcePdf.numPages;
        
        // Get user options from UI
        const convertPageFormat = document.querySelector('input[name="page-format"]:checked')?.value || 'double';
        const convertRemoveFirstLeft = document.getElementById('remove-first-left')?.checked || false;
        const skipFirstPage = skipFirstPageCheckbox.checked;
        const quality = parseFloat(qualitySelect.value);
        
        DEBUG_CONVERTER.log('INFO', 'USER_OPTIONS', 'Conversion options', {
            pageFormat: convertPageFormat,
            removeFirstLeft: convertRemoveFirstLeft,
            skipFirstPage,
            quality
        });
        
        const startPage = skipFirstPage ? 2 : 1;
        const totalPages = skipFirstPage ? pageCount - 1 : pageCount;
        
        const formatText = convertPageFormat === 'single' ? 'pages simples' : 'pages doubles';
        const skipText = skipFirstPage ? ' - première page ignorée' : '';
        const removeText = (convertPageFormat === 'double' && convertRemoveFirstLeft) ? ' - 1ère moitié gauche supprimée' : '';
        
        showStatus(`📖 Traitement de ${totalPages} pages en ${formatText} (qualité: ${Math.round(quality * 100)}%)${skipText}${removeText}...`, 'info');
        
        // Use the new split function with progress callback
        const { pdfDoc: newPdfDoc, stats } = await splitPDFPages(sourcePdf, {
            pageFormat: convertPageFormat,
            removeFirstLeft: convertRemoveFirstLeft,
            skipFirstPage: skipFirstPage,
            quality: quality,
            progressCallback: (progress, currentPage, total) => {
                showStatus(`⏳ Progression: ${progress}% (page ${currentPage}/${total})`, 'info');
            }
        });
        
        DEBUG_CONVERTER.log('SUCCESS', 'SPLIT_STATS', 'Split statistics', stats);
        
        // Save the new PDF
        DEBUG_CONVERTER.startTimer('PDF Save');
        convertedPdfBytes = await newPdfDoc.save();
        DEBUG_CONVERTER.endTimer('PDF Save');
        
        const fileSizeMB = (convertedPdfBytes.length / 1024 / 1024).toFixed(2);
        const originalSizeMB = (arrayBuffer.byteLength / 1024 / 1024).toFixed(2);
        const compressionRatio = ((1 - convertedPdfBytes.length / arrayBuffer.byteLength) * 100).toFixed(1);
        
        DEBUG_CONVERTER.log('SUCCESS', 'FILE_SIZES', 'Size comparison', {
            original: originalSizeMB + ' MB',
            converted: fileSizeMB + ' MB',
            compression: compressionRatio + '%',
            outputPages: stats.outputPages
        });
        
        const pageText = convertPageFormat === 'single' 
            ? `${stats.outputPages} pages conservées`
            : `${stats.outputPages} pages créées`;
            
        showStatus(`✅ Conversion terminée! ${pageText}. Taille: ${fileSizeMB} MB (original: ${originalSizeMB} MB${compressionRatio > 0 ? ', compression: -' + compressionRatio + '%' : ''})`, 'success');
        convertProcessBtn.style.display = 'none';
        convertDownloadBtn.style.display = 'inline-block';
        
        // Show "Open in Reader" button
        const openReaderBtn = document.getElementById('open-reader-btn');
        if (openReaderBtn) {
            openReaderBtn.style.display = 'inline-block';
        }
        
        convertProcessBtn.disabled = false;
        
        DEBUG_CONVERTER.log('SUCCESS', 'CONVERTER_COMPLETE', 'Conversion process finished successfully', null);
        DEBUG_CONVERTER.groupEnd();
        
    } catch (error) {
        DEBUG_CONVERTER.log('ERROR', 'CONVERTER_ERROR', 'Conversion failed', {
            error: error.message,
            stack: error.stack
        });
        DEBUG_CONVERTER.groupEnd();
        
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
