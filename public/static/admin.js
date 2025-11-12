// ==========================================
// ADMIN PANEL - Document Library Management
// ==========================================

// ==========================================
// DEBUG LOGGING SYSTEM
// ==========================================
const DEBUG = {
    enabled: true, // Set to false in production
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
        const prefix = `${icon} [${timestamp}] [${category}]`;
        
        if (data) {
            console.log(`${prefix} ${message}`, data);
        } else {
            console.log(`${prefix} ${message}`);
        }
    },
    
    info: function(category, message, data) {
        this.log('INFO', category, message, data);
    },
    
    success: function(category, message, data) {
        this.log('SUCCESS', category, message, data);
    },
    
    warn: function(category, message, data) {
        this.log('WARNING', category, message, data);
    },
    
    error: function(category, message, data) {
        this.log('ERROR', category, message, data);
    },
    
    debug: function(category, message, data) {
        this.log('DEBUG', category, message, data);
    },
    
    perf: function(category, operation, duration) {
        this.log('PERF', category, `${operation} completed in ${duration}ms`);
    },
    
    // Timer utility
    startTimer: function(label) {
        if (!this.enabled) return;
        console.time(label);
    },
    
    endTimer: function(label) {
        if (!this.enabled) return;
        console.timeEnd(label);
    },
    
    // Group logs
    group: function(title) {
        if (!this.enabled) return;
        console.group(title);
    },
    
    groupEnd: function() {
        if (!this.enabled) return;
        console.groupEnd();
    }
};

// Expose globally for easy access
window.DEBUG = DEBUG;

// ==========================================
// PDF COMPRESSION SYSTEM
// ==========================================

/**
 * Compress PDF by rendering pages at lower resolution and re-encoding as JPEG
 * Uses pdf.js to render and pdf-lib to create new PDF
 * @param {File} file - Original PDF file
 * @param {Function} progressCallback - Progress callback (optional)
 * @returns {Promise<{compressedFile: File, originalSize: number, compressedSize: number, compressionRatio: number}>}
 */
async function compressPDF(file, progressCallback = null) {
    const compressStartTime = performance.now();
    DEBUG.group(`🗜️ COMPRESS PDF: ${file.name}`);
    DEBUG.info('PDF-COMPRESS', `Original size: ${formatBytes(file.size)}`);
    
    try {
        if (progressCallback) {
            progressCallback('📖 Chargement du PDF...', 5);
        }
        
        // Load original PDF with pdf.js (for rendering)
        DEBUG.startTimer('PDF-COMPRESS-load-pdfjsLib');
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDocument = await loadingTask.promise;
        DEBUG.endTimer('PDF-COMPRESS-load-pdfjsLib');
        
        const pageCount = pdfDocument.numPages;
        DEBUG.info('PDF-COMPRESS', `Pages: ${pageCount}`);
        
        // Create new PDF with pdf-lib
        DEBUG.startTimer('PDF-COMPRESS-create-new-pdf');
        const newPdfDoc = await PDFLib.PDFDocument.create();
        DEBUG.endTimer('PDF-COMPRESS-create-new-pdf');
        
        DEBUG.startTimer('PDF-COMPRESS-process-pages');
        
        // Process each page
        for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
            if (progressCallback) {
                const progress = 10 + ((pageNum / pageCount) * 85);
                progressCallback(`🗜️ Page ${pageNum}/${pageCount}...`, progress);
            }
            
            // Render page with pdf.js at reduced scale
            const page = await pdfDocument.getPage(pageNum);
            const scale = 1.5; // 150 DPI (down from 300 DPI) - good for web display
            const viewport = page.getViewport({ scale });
            
            DEBUG.debug('PDF-COMPRESS', `Page ${pageNum}: ${Math.round(viewport.width)}x${Math.round(viewport.height)}`);
            
            // Create canvas and render
            const canvas = document.createElement('canvas');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext('2d');
            
            await page.render({
                canvasContext: ctx,
                viewport: viewport
            }).promise;
            
            // Convert canvas to JPEG with quality 0.8
            const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.8);
            const jpegImageBytes = await fetch(jpegDataUrl).then(res => res.arrayBuffer());
            
            // Embed image in new PDF
            const jpegImage = await newPdfDoc.embedJpg(jpegImageBytes);
            
            // Calculate PDF page size (convert pixels to points: 72 DPI)
            const pdfWidth = (viewport.width / scale) * 72 / 96; // Convert to points
            const pdfHeight = (viewport.height / scale) * 72 / 96;
            
            // Add page to new PDF
            const newPage = newPdfDoc.addPage([pdfWidth, pdfHeight]);
            newPage.drawImage(jpegImage, {
                x: 0,
                y: 0,
                width: pdfWidth,
                height: pdfHeight,
            });
        }
        
        DEBUG.endTimer('PDF-COMPRESS-process-pages');
        
        if (progressCallback) {
            progressCallback('💾 Finalisation...', 95);
        }
        
        // Save compressed PDF
        DEBUG.startTimer('PDF-COMPRESS-save');
        const compressedPdfBytes = await newPdfDoc.save();
        DEBUG.endTimer('PDF-COMPRESS-save');
        
        const compressedFile = new File(
            [compressedPdfBytes], 
            file.name, 
            { type: 'application/pdf' }
        );
        
        const originalSize = file.size;
        const compressedSize = compressedFile.size;
        const compressionRatio = ((originalSize - compressedSize) / originalSize * 100).toFixed(1);
        
        const totalDuration = performance.now() - compressStartTime;
        DEBUG.perf('PDF-COMPRESS', file.name, Math.round(totalDuration));
        DEBUG.success('PDF-COMPRESS', `Compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${compressionRatio}%)`);
        DEBUG.groupEnd();
        
        if (progressCallback) {
            progressCallback('✅ Compression terminée !', 100);
        }
        
        return {
            compressedFile,
            originalSize,
            compressedSize,
            compressionRatio: parseFloat(compressionRatio)
        };
        
    } catch (error) {
        const totalDuration = performance.now() - compressStartTime;
        DEBUG.error('PDF-COMPRESS', `Compression failed after ${Math.round(totalDuration)}ms`, error);
        DEBUG.groupEnd();
        
        // Return original file if compression fails
        DEBUG.warn('PDF-COMPRESS', 'Returning original file (compression failed)');
        return {
            compressedFile: file,
            originalSize: file.size,
            compressedSize: file.size,
            compressionRatio: 0,
            error: error.message
        };
    }
}

/**
 * Check if PDF needs compression (> 10 MB)
 * @param {File} file - PDF file
 * @returns {boolean}
 */
function shouldCompressPDF(file) {
    const threshold = 10 * 1024 * 1024; // 10 MB
    return file.size > threshold;
}

// ==========================================
// PDF PAGE SPLITTING - Conditional split based on format
// ==========================================
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
    DEBUG.group('📄 SPLIT PDF PAGES');
    DEBUG.startTimer('Total Split Duration');
    
    const {
        pageFormat = 'double',
        removeFirstLeft = false,
        skipFirstPage = false,
        quality = 0.9
    } = options;
    
    DEBUG.log('INFO', 'SPLIT_OPTIONS', 'Configuration', {
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
    const newPdfDoc = await PDFLib.PDFDocument.create();
    
    let processedPages = 0;
    let skippedFirstLeft = false;
    
    // Process each page
    for (let i = startPage; i <= pageCount; i++) {
        DEBUG.group(`📄 Page ${i}/${pageCount}`);
        DEBUG.startTimer(`Page ${i} Processing`);
        
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
        
        DEBUG.log('DEBUG', 'PAGE_DIMENSIONS', `Page ${i}`, {
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
        
        DEBUG.startTimer(`Page ${i} Render`);
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
        DEBUG.endTimer(`Page ${i} Render`);
        
        // CONDITIONAL SPLIT LOGIC
        if (pageFormat === 'single') {
            // NO SPLIT - Keep page as is
            DEBUG.log('INFO', 'NO_SPLIT', `Page ${i} kept as single page`, null);
            
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
            DEBUG.log('INFO', 'SPLIT_MODE', `Page ${i} splitting into 2 halves`, {
                firstPage: i === startPage,
                removeFirstLeft: removeFirstLeft && i === startPage
            });
            
            // Check if we should skip left half of first page
            const shouldSkipLeft = (i === startPage && removeFirstLeft);
            
            if (shouldSkipLeft) {
                DEBUG.log('WARNING', 'SKIP_FIRST_LEFT', `Skipping LEFT half of page ${i}`, null);
                skippedFirstLeft = true;
            }
            
            // Extract left half (unless skipped)
            if (!shouldSkipLeft) {
                DEBUG.startTimer(`Page ${i} Left Half`);
                
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
                DEBUG.endTimer(`Page ${i} Left Half`);
                DEBUG.log('SUCCESS', 'LEFT_HALF', `Page ${i} left half created`, null);
            }
            
            // Extract right half (always)
            DEBUG.startTimer(`Page ${i} Right Half`);
            
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
            DEBUG.endTimer(`Page ${i} Right Half`);
            DEBUG.log('SUCCESS', 'RIGHT_HALF', `Page ${i} right half created`, null);
        }
        
        DEBUG.endTimer(`Page ${i} Processing`);
        DEBUG.groupEnd();
        
        // Update progress callback if provided
        const progress = Math.round(((i - startPage + 1) / totalPages) * 100);
        if (options.progressCallback) {
            options.progressCallback(progress, i, totalPages);
        }
    }
    
    DEBUG.endTimer('Total Split Duration');
    
    const stats = {
        sourcePages: pageCount,
        processedPages: totalPages,
        outputPages: processedPages,
        skippedFirstPage: skipFirstPage,
        skippedFirstLeft: skippedFirstLeft,
        pageFormat: pageFormat,
        quality: quality
    };
    
    DEBUG.log('SUCCESS', 'SPLIT_COMPLETE', 'PDF split completed', stats);
    DEBUG.groupEnd();
    
    return { pdfDoc: newPdfDoc, stats };
}

let isAuthenticated = false;

// Check if already authenticated
window.addEventListener('DOMContentLoaded', () => {
    const stored = localStorage.getItem('admin_auth');
    if (stored === 'true') {
        isAuthenticated = true;
        showAdminPanel();
    } else {
        showLoginForm();
    }
});

function showLoginForm() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800">
            <div class="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md">
                <div class="text-center mb-8">
                    <i class="fas fa-shield-alt text-6xl text-blue-600 mb-4"></i>
                    <h1 class="text-3xl font-bold text-gray-800">Administration</h1>
                    <p class="text-gray-600 mt-2">Gestion de la bibliothèque de documents</p>
                </div>
                
                <form id="login-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">Mot de passe</label>
                        <input 
                            type="password" 
                            id="password-input" 
                            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-800"
                            placeholder="Entrez le mot de passe admin"
                            required
                        />
                    </div>
                    
                    <div id="login-error" class="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"></div>
                    
                    <button 
                        type="submit" 
                        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
                    >
                        <i class="fas fa-sign-in-alt mr-2"></i>
                        Se connecter
                    </button>
                </form>
            </div>
        </div>
    `;
    
    document.getElementById('login-form').addEventListener('submit', handleLogin);
}

async function handleLogin(e) {
    e.preventDefault();
    
    const password = document.getElementById('password-input').value;
    const errorDiv = document.getElementById('login-error');
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        
        const data = await response.json();
        
        if (data.success) {
            localStorage.setItem('admin_auth', 'true');
            isAuthenticated = true;
            showAdminPanel();
        } else {
            errorDiv.textContent = 'Mot de passe incorrect';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Login error:', error);
        errorDiv.textContent = 'Erreur de connexion';
        errorDiv.classList.remove('hidden');
    }
}

function logout() {
    localStorage.removeItem('admin_auth');
    isAuthenticated = false;
    showLoginForm();
}

function showAdminPanel() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800">
            <!-- Header -->
            <div class="bg-gray-800 shadow-lg border-b border-gray-700">
                <div class="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <h1 class="text-2xl font-bold text-white flex items-center gap-3">
                            <i class="fas fa-book-open text-blue-400"></i>
                            Training Storybook Admin
                        </h1>
                        <p class="text-gray-400 text-sm mt-1">Document management & tools</p>
                    </div>
                    <button 
                        onclick="logout()" 
                        class="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                    >
                        <i class="fas fa-sign-out-alt"></i>
                        Déconnexion
                    </button>
                </div>
            </div>
            
            <!-- Navigation Tabs -->
            <div class="bg-gray-800 border-b border-gray-700">
                <div class="max-w-7xl mx-auto px-4">
                    <div class="flex gap-1">
                        <button 
                            id="tab-library" 
                            onclick="switchTab('library')"
                            class="px-6 py-3 text-white font-semibold border-b-2 border-blue-500 bg-gray-900"
                        >
                            <i class="fas fa-book mr-2"></i>
                            Bibliothèque
                        </button>
                        <button 
                            id="tab-converter" 
                            onclick="switchTab('converter')"
                            class="px-6 py-3 text-gray-400 font-semibold border-b-2 border-transparent hover:text-white hover:bg-gray-700 transition"
                        >
                            <i class="fas fa-file-pdf mr-2"></i>
                            Convertisseur PDF
                        </button>
                        <button 
                            id="tab-security" 
                            onclick="switchTab('security')"
                            class="px-6 py-3 text-gray-400 font-semibold border-b-2 border-transparent hover:text-white hover:bg-gray-700 transition"
                        >
                            <i class="fas fa-lock mr-2"></i>
                            Sécurité
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Main Content -->
            <div class="max-w-7xl mx-auto px-4 py-8">
                <!-- Library Tab Content -->
                <div id="library-content">
                <!-- Upload Section -->
                <div class="bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-700">
                    <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <i class="fas fa-cloud-upload-alt text-blue-400"></i>
                        Ajouter un Document
                    </h2>
                    
                    <form id="upload-form" class="space-y-4">
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Fichier PDF</label>
                                <input 
                                    type="file" 
                                    id="pdf-file" 
                                    accept=".pdf"
                                    class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-300 mb-2">Description (optionnelle)</label>
                                <input 
                                    type="text" 
                                    id="pdf-description" 
                                    class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Formation bancassurance module 1"
                                />
                            </div>
                        </div>
                        
                        <div id="upload-progress" class="hidden">
                            <div class="bg-blue-900 rounded-lg p-4">
                                <div class="flex items-center gap-3">
                                    <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                                    <span class="text-white">Upload en cours...</span>
                                </div>
                            </div>
                        </div>
                        
                        <div id="upload-success" class="hidden bg-green-900 border border-green-700 rounded-lg p-4">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-check-circle text-green-400 text-xl"></i>
                                <div class="flex-1">
                                    <p class="text-white font-semibold mb-2">Document ajouté avec succès !</p>
                                    <div class="bg-gray-800 rounded p-3 flex items-center gap-2">
                                        <input 
                                            type="text" 
                                            id="share-url" 
                                            readonly 
                                            class="flex-1 bg-transparent text-gray-300 text-sm"
                                        />
                                        <button 
                                            type="button"
                                            onclick="copyShareUrl()"
                                            class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                        >
                                            <i class="fas fa-copy"></i> Copier
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
                        >
                            <i class="fas fa-upload"></i>
                            Télécharger vers R2
                        </button>
                    </form>
                </div>
                
                <!-- Documents List -->
                <div class="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-xl font-bold text-white flex items-center gap-2">
                            <i class="fas fa-list text-blue-400"></i>
                            Documents Disponibles
                        </h2>
                        <button 
                            onclick="loadDocuments()"
                            class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                        >
                            <i class="fas fa-sync-alt"></i>
                            Actualiser
                        </button>
                    </div>
                    
                    <div id="documents-list">
                        <div class="text-center py-12">
                            <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                            <p class="text-gray-400 mt-4">Chargement...</p>
                        </div>
                    </div>
                </div>
                </div>
                <!-- End library-content -->
                
                <!-- Converter Tab Content (hidden by default) -->
                <div id="converter-content" class="hidden"></div>
                
                <!-- Security Tab Content (hidden by default) -->
                <div id="security-content" class="hidden"></div>
            </div>
        </div>
    `;
    
    // Show library tab by default
    switchTab('library');
}

// Switch between tabs
function switchTab(tabName) {
    // Update tab buttons
    const tabs = ['library', 'converter', 'security'];
    tabs.forEach(tab => {
        const button = document.getElementById(`tab-${tab}`);
        const content = document.getElementById(`${tab}-content`);
        
        if (tab === tabName) {
            button.className = 'px-6 py-3 text-white font-semibold border-b-2 border-blue-500 bg-gray-900';
            content.classList.remove('hidden');
        } else {
            button.className = 'px-6 py-3 text-gray-400 font-semibold border-b-2 border-transparent hover:text-white hover:bg-gray-700 transition';
            content.classList.add('hidden');
        }
    });
    
    // Load content for the selected tab
    if (tabName === 'library') {
        showLibraryContent();
    } else if (tabName === 'converter') {
        showConverterContent();
    } else if (tabName === 'security') {
        showSecurityContent();
    }
}

// Show Library Tab Content
function showLibraryContent() {
    const content = document.getElementById('library-content');
    content.innerHTML = `
        <!-- Upload Section -->
        <div class="bg-gray-800 rounded-xl shadow-xl p-6 mb-8 border border-gray-700">
            <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <i class="fas fa-cloud-upload-alt text-blue-400"></i>
                Ajouter un Document
            </h2>
            
            <form id="upload-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                        Fichier(s) PDF
                        <span class="text-xs text-gray-500 ml-2">✨ Nouveau : Upload multiple supporté !</span>
                    </label>
                    <input 
                        type="file" 
                        id="pdf-file" 
                        accept=".pdf"
                        multiple
                        class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                        onchange="handleFileSelection()"
                        required
                    />
                    
                    <!-- File Preview List -->
                    <div id="file-preview-list" class="hidden mt-3 space-y-2 max-h-60 overflow-y-auto">
                        <!-- Files will be listed here -->
                    </div>
                    
                    <!-- AI Analysis Button -->
                    <button type="button" 
                            onclick="analyzeUploadFile()" 
                            id="ai-analyze-btn"
                            class="mt-2 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                        <i class="fas fa-magic"></i>
                        ✨ Analyser avec IA
                    </button>
                    <p class="text-xs text-gray-500 mt-1">
                        Génère automatiquement la description, les tags et le dossier. Pour l'upload multiple, cette analyse s'appliquera à tous les fichiers.
                    </p>
                </div>
                
                <!-- NEW: Page Split Options for Upload -->
                <div class="bg-gray-700 p-4 rounded-lg border-2 border-purple-500">
                    <label class="block mb-3">
                        <span class="text-sm font-medium text-white flex items-center gap-2">
                            <i class="fas fa-columns text-purple-400"></i>
                            Format des pages PDF
                        </span>
                    </label>
                    <div class="space-y-2">
                        <label class="flex items-start gap-3 bg-gray-600 p-2 rounded cursor-pointer hover:bg-gray-550 transition">
                            <input type="radio" name="upload-page-format" value="single" checked class="mt-1" onchange="toggleUploadSplitOptions()" />
                            <div>
                                <p class="text-white text-sm font-semibold">📄 Pages simples</p>
                                <p class="text-gray-400 text-xs">Format standard (1 page = 1 page PDF)</p>
                            </div>
                        </label>
                        
                        <label class="flex items-start gap-3 bg-gray-600 p-2 rounded cursor-pointer hover:bg-gray-550 transition">
                            <input type="radio" name="upload-page-format" value="double" class="mt-1" onchange="toggleUploadSplitOptions()" />
                            <div class="flex-1">
                                <p class="text-white text-sm font-semibold">📖 Pages doubles</p>
                                <p class="text-gray-400 text-xs mb-1">2 pages côte à côte (à spliter)</p>
                                
                                <div id="upload-split-suboptions" class="hidden mt-1 pl-4 border-l-2 border-purple-400">
                                    <label class="flex items-start gap-2 cursor-pointer">
                                        <input type="checkbox" id="upload-remove-first-left" class="mt-0.5" />
                                        <p class="text-white text-xs">✂️ Supprimer partie gauche 1ère page</p>
                                    </label>
                                </div>
                            </div>
                        </label>
                    </div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Description (optionnelle)</label>
                    <input 
                        type="text" 
                        id="pdf-description" 
                        class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Formation bancassurance module 1"
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Dossier (optionnel)</label>
                    <input 
                        type="text" 
                        id="pdf-folder" 
                        class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Formation/Bancassurance"
                    />
                    <p class="text-gray-500 text-xs mt-1">💡 Utilisez "/" pour créer une hiérarchie</p>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">Tags (optionnels)</label>
                    <div class="flex gap-2 mb-2">
                        <input 
                            type="text" 
                            id="pdf-tag-input" 
                            class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Ajouter un tag"
                            onkeypress="if(event.key === 'Enter') { event.preventDefault(); addUploadTag(); }"
                        />
                        <button 
                            type="button"
                            onclick="addUploadTag()"
                            class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                        >
                            <i class="fas fa-plus mr-1"></i> Ajouter
                        </button>
                    </div>
                    <div id="upload-tags-container" class="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-700 rounded-lg border border-gray-600">
                        <span class="text-gray-500 text-sm italic">Aucun tag</span>
                    </div>
                </div>
                
                <div id="upload-progress" class="hidden">
                    <div class="bg-blue-900 rounded-lg p-4">
                        <div class="flex items-center gap-3">
                            <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                            <span class="text-white">Upload en cours...</span>
                        </div>
                    </div>
                </div>
                
                <div id="upload-success" class="hidden bg-green-900 border border-green-700 rounded-lg p-4">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-check-circle text-green-400 text-xl"></i>
                        <div class="flex-1">
                            <p class="text-white font-semibold mb-2">Document ajouté avec succès !</p>
                            <div class="bg-gray-800 rounded p-3 flex items-center gap-2">
                                <input 
                                    type="text" 
                                    id="share-url" 
                                    readonly 
                                    class="flex-1 bg-transparent text-gray-300 text-sm"
                                />
                                <button 
                                    type="button"
                                    onclick="copyShareUrl()"
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                                >
                                    <i class="fas fa-copy"></i> Copier
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <button 
                    type="submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
                >
                    <i class="fas fa-upload"></i>
                    Télécharger vers R2
                </button>
            </form>
        </div>
        
        <!-- Documents List -->
        <div class="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold text-white flex items-center gap-2">
                    <i class="fas fa-list text-blue-400"></i>
                    Documents Disponibles
                </h2>
                <div class="flex gap-2">
                    <button 
                        onclick="loadDocuments()"
                        class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                    >
                        <i class="fas fa-sync-alt"></i>
                        Actualiser
                    </button>
                    <button 
                        onclick="openBatchAnalyze()"
                        class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                        title="Analyser plusieurs documents avec l'IA"
                    >
                        <i class="fas fa-magic"></i>
                        Analyser par lot
                    </button>
                </div>
            </div>
            
            <!-- Search and Filters -->
            <div class="mb-6 space-y-4">
                <div class="flex gap-4 flex-wrap">
                    <div class="flex-1 min-w-[250px]">
                        <input 
                            type="text" 
                            id="search-input" 
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="🔍 Rechercher (nom, description, tags)..."
                            oninput="filterDocuments()"
                        />
                    </div>
                    <div class="min-w-[200px]">
                        <select 
                            id="folder-filter" 
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            onchange="filterDocuments()"
                        >
                            <option value="">📁 Tous les dossiers</option>
                        </select>
                    </div>
                    <div class="min-w-[200px]">
                        <select 
                            id="tag-filter" 
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            onchange="filterDocuments()"
                        >
                            <option value="">🏷️ Tous les tags</option>
                        </select>
                    </div>
                    <button 
                        onclick="clearFilters()"
                        class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition"
                        title="Réinitialiser les filtres"
                    >
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            
            <div id="documents-list">
                <div class="text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto"></div>
                    <p class="text-gray-400 mt-4">Chargement...</p>
                </div>
            </div>
        </div>
        
        <!-- Share Modal -->
        <div id="share-modal" class="hidden fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div class="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
                <div class="p-6">
                    <div class="flex justify-between items-center mb-6">
                        <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                            <i class="fas fa-share-alt text-purple-400"></i>
                            Options de Partage
                        </h2>
                        <button onclick="closeShareModal()" class="text-gray-400 hover:text-white text-2xl">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    
                    <div id="share-modal-content"></div>
                </div>
            </div>
        </div>
    `;
    
    // Setup event listeners
    document.getElementById('upload-form').addEventListener('submit', handleUpload);
    
    // Setup drag & drop for file input
    const uploadForm = document.getElementById('upload-form');
    const fileInput = document.getElementById('pdf-file');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadForm.addEventListener(eventName, preventDefaults, false);
    });
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadForm.addEventListener(eventName, () => {
            uploadForm.classList.add('drag-active');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadForm.addEventListener(eventName, () => {
            uploadForm.classList.remove('drag-active');
        }, false);
    });
    
    uploadForm.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0 && files[0].type === 'application/pdf') {
            fileInput.files = files;
            // Trigger change event
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    }, false);
    
    loadDocuments();
    
    // Update AI buttons visibility on initial load
    updateAnalyzeButtonsVisibility();
}

// Show Converter Tab Content
function showConverterContent() {
    console.log('showConverterContent() called');
    const content = document.getElementById('converter-content');
    
    if (!content) {
        console.error('converter-content element not found!');
        return;
    }
    
    console.log('Setting converter content HTML...');
    content.innerHTML = `
        <div class="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700">
            <h2 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <i class="fas fa-file-pdf text-blue-400"></i>
                Convertisseur PDF A3 → A5 (Format Livret)
            </h2>
            
            <p class="text-gray-300 mb-6">
                Convertissez vos documents A3 en format livret A5 imprimable. 
                Le PDF résultant sera optimisé pour une impression recto-verso avec reliure au centre.
            </p>
            
            <!-- Upload PDF Form -->
            <form id="converter-form" class="space-y-6">
                <!-- File Input -->
                <div class="bg-gray-700 rounded-lg p-6 border-2 border-dashed border-gray-600 hover:border-blue-500 transition">
                    <label class="block text-center cursor-pointer">
                        <input 
                            type="file" 
                            id="converter-pdf-file" 
                            accept=".pdf"
                            class="hidden"
                            required
                        />
                        <div>
                            <i class="fas fa-cloud-upload-alt text-6xl text-gray-400 mb-4"></i>
                            <p class="text-white font-semibold mb-2">Cliquez pour sélectionner un PDF</p>
                            <p class="text-gray-400 text-sm">ou glissez-déposez le fichier ici</p>
                            <p id="selected-filename" class="text-blue-400 mt-4 hidden"></p>
                        </div>
                    </label>
                </div>
                
                <!-- Options -->
                <div class="space-y-4">
                    <h3 class="text-lg font-semibold text-white flex items-center gap-2">
                        <i class="fas fa-cog"></i>
                        Options de conversion
                    </h3>
                    
                    <div class="space-y-4">
                        <!-- NEW: Page Split Options -->
                        <div class="bg-gray-700 p-4 rounded-lg border-2 border-purple-500">
                            <label class="block mb-3">
                                <span class="text-white font-semibold flex items-center gap-2">
                                    <i class="fas fa-columns text-purple-400"></i>
                                    Format des pages
                                </span>
                            </label>
                            <div class="space-y-3">
                                <label class="flex items-start gap-3 bg-gray-600 p-3 rounded cursor-pointer hover:bg-gray-550 transition">
                                    <input type="radio" name="page-format" value="single" checked class="mt-1" onchange="toggleSplitOptions()" />
                                    <div>
                                        <p class="text-white font-semibold">📄 Pages simples (défaut)</p>
                                        <p class="text-gray-400 text-xs">Chaque page PDF = 1 page (format portrait ou paysage standard)</p>
                                    </div>
                                </label>
                                
                                <label class="flex items-start gap-3 bg-gray-600 p-3 rounded cursor-pointer hover:bg-gray-550 transition">
                                    <input type="radio" name="page-format" value="double" class="mt-1" onchange="toggleSplitOptions()" />
                                    <div class="flex-1">
                                        <p class="text-white font-semibold">📖 Pages doubles (à spliter)</p>
                                        <p class="text-gray-400 text-xs mb-2">Chaque page PDF contient 2 pages côte à côte (livret/magazine)</p>
                                        
                                        <!-- Sub-option: Remove left part of first page -->
                                        <div id="split-suboptions" class="hidden mt-2 pl-6 border-l-2 border-purple-400">
                                            <label class="flex items-start gap-2 cursor-pointer">
                                                <input type="checkbox" id="remove-first-left" class="mt-1" />
                                                <div>
                                                    <p class="text-white text-sm">✂️ Supprimer la partie gauche de la 1ère page</p>
                                                    <p class="text-gray-400 text-xs">Utile si la couverture a une page vide à gauche</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Option 1: Skip first page -->
                        <label class="flex items-start gap-3 bg-gray-700 p-4 rounded-lg cursor-pointer hover:bg-gray-600 transition">
                            <input type="checkbox" id="skip-first-page" class="mt-1" />
                            <div>
                                <p class="text-white font-semibold">Ignorer la première page</p>
                                <p class="text-gray-400 text-sm">Utile si la première page est blanche ou une page de garde</p>
                            </div>
                        </label>
                        
                        <!-- Option 2: Quality selector -->
                        <div class="bg-gray-700 p-4 rounded-lg">
                            <label class="block mb-2">
                                <span class="text-white font-semibold">Qualité d'image</span>
                                <p class="text-gray-400 text-sm">Qualité plus élevée = fichier plus lourd</p>
                            </label>
                            <select id="quality-select" class="w-full px-4 py-2 bg-gray-600 border border-gray-500 rounded-lg text-white focus:ring-2 focus:ring-blue-500">
                                <option value="0.7">Basse qualité (plus petit fichier)</option>
                                <option value="0.85" selected>Qualité moyenne (recommandé)</option>
                                <option value="0.95">Haute qualité (fichier plus lourd)</option>
                            </select>
                        </div>
                    </div>
                </div>
                
                <!-- Progress -->
                <div id="converter-progress" class="hidden">
                    <div class="bg-blue-900 rounded-lg p-4">
                        <div class="flex items-center gap-3 mb-2">
                            <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                            <span class="text-white font-semibold">Conversion en cours...</span>
                        </div>
                        <p class="text-gray-300 text-sm">Cela peut prendre quelques instants selon la taille du document.</p>
                    </div>
                </div>
                
                <!-- Success -->
                <div id="converter-success" class="hidden bg-green-900 border border-green-700 rounded-lg p-4">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-check-circle text-green-400 text-2xl"></i>
                        <div class="flex-1">
                            <p class="text-white font-semibold mb-3">Conversion réussie !</p>
                            
                            <!-- Description field -->
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-300 mb-2">Description pour la bibliothèque</label>
                                <input 
                                    type="text" 
                                    id="converter-description" 
                                    value="Document converti en format livret A5"
                                    class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Description du document"
                                />
                                
                                <!-- AI Analysis Button -->
                                <button type="button" 
                                        onclick="analyzeConvertedFile()" 
                                        class="mt-2 w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center justify-center gap-2">
                                    <i class="fas fa-magic"></i>
                                    ✨ Analyser avec IA
                                </button>
                                <p class="text-xs text-gray-500 mt-1">
                                    Génère automatiquement la description, les tags et le dossier
                                </p>
                            </div>
                            
                            <!-- Folder field -->
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-300 mb-2">Dossier</label>
                                <input 
                                    type="text" 
                                    id="converter-folder" 
                                    class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                    placeholder="Ex: Formation/Bancassurance"
                                />
                                <p class="text-gray-500 text-xs mt-1">💡 Utilisez "/" pour créer une hiérarchie</p>
                            </div>
                            
                            <!-- Tags field -->
                            <div class="mb-4">
                                <label class="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                                <div class="flex gap-2 mb-2">
                                    <input 
                                        type="text" 
                                        id="converter-tag-input" 
                                        class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                        placeholder="Ajouter un tag"
                                        onkeypress="if(event.key === 'Enter') { event.preventDefault(); addConverterTag(); }"
                                    />
                                    <button 
                                        type="button"
                                        onclick="addConverterTag()"
                                        class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                                    >
                                        <i class="fas fa-plus mr-1"></i> Ajouter
                                    </button>
                                </div>
                                <div id="converter-tags-container" class="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-700 rounded-lg border border-gray-600">
                                    <span class="text-gray-500 text-sm italic">Aucun tag</span>
                                </div>
                            </div>
                            
                            <!-- Upload progress -->
                            <div id="upload-progress-container" class="hidden mb-4">
                                <div class="flex items-center justify-between text-sm text-gray-300 mb-2">
                                    <span>Upload vers la bibliothèque...</span>
                                    <span id="upload-percentage">0%</span>
                                </div>
                                <div class="w-full bg-gray-700 rounded-full h-2.5">
                                    <div id="upload-progress-bar" class="bg-blue-600 h-2.5 rounded-full transition-all duration-300" style="width: 0%"></div>
                                </div>
                            </div>
                            
                            <!-- Upload success message -->
                            <div id="upload-complete-message" class="hidden bg-blue-900 border border-blue-700 rounded-lg p-3 mb-4">
                                <div class="flex items-center gap-2">
                                    <i class="fas fa-check-circle text-blue-400"></i>
                                    <span class="text-white text-sm">✓ Ajouté à la bibliothèque avec succès !</span>
                                </div>
                            </div>
                            
                            <div class="flex gap-3">
                                <button 
                                    type="button"
                                    onclick="downloadConvertedPDF()"
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                                >
                                    <i class="fas fa-download"></i>
                                    Télécharger le PDF
                                </button>
                                <button 
                                    type="button"
                                    id="upload-library-btn"
                                    onclick="uploadConvertedToLibrary()"
                                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition flex items-center gap-2"
                                >
                                    <i class="fas fa-upload"></i>
                                    <span id="upload-btn-text">Ajouter à la bibliothèque</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Error -->
                <div id="converter-error" class="hidden bg-red-900 border border-red-700 rounded-lg p-4">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-exclamation-triangle text-red-400 text-xl"></i>
                        <div>
                            <p class="text-white font-semibold">Erreur de conversion</p>
                            <p id="converter-error-message" class="text-gray-300 text-sm mt-1"></p>
                        </div>
                    </div>
                </div>
                
                <!-- Submit Button -->
                <button 
                    type="submit" 
                    class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center gap-2"
                >
                    <i class="fas fa-sync-alt"></i>
                    Convertir en format livret
                </button>
            </form>
        </div>
    `;
    
    // Setup file input display
    const fileInput = document.getElementById('converter-pdf-file');
    const filenameDisplay = document.getElementById('selected-filename');
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            filenameDisplay.textContent = `✓ ${e.target.files[0].name}`;
            filenameDisplay.classList.remove('hidden');
        }
    });
    
    // Setup converter form submission
    document.getElementById('converter-form').addEventListener('submit', handleConversion);
    
    // Setup drag & drop for converter
    const converterForm = document.getElementById('converter-form');
    const dropZone = converterForm.querySelector('.bg-gray-700');
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
        }, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.add('border-blue-500', 'bg-gray-600');
        }, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => {
            dropZone.classList.remove('border-blue-500', 'bg-gray-600');
        }, false);
    });
    
    dropZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        
        if (files.length > 0 && files[0].type === 'application/pdf') {
            fileInput.files = files;
            const event = new Event('change', { bubbles: true });
            fileInput.dispatchEvent(event);
        }
    }, false);
}

// Handle PDF conversion
let convertedPDFBlob = null;
let convertedFilename = '';

async function handleConversion(e) {
    e.preventDefault();
    
    const fileInput = document.getElementById('converter-pdf-file');
    const progressDiv = document.getElementById('converter-progress');
    const successDiv = document.getElementById('converter-success');
    const errorDiv = document.getElementById('converter-error');
    const errorMessage = document.getElementById('converter-error-message');
    
    // Hide previous messages
    successDiv.classList.add('hidden');
    errorDiv.classList.add('hidden');
    
    // Show progress
    progressDiv.classList.remove('hidden');
    
    try {
        DEBUG.group('🔧 CONVERTER PROCESS START');
        
        let file = fileInput.files[0];
        if (!file) {
            throw new Error('Veuillez sélectionner un fichier PDF');
        }
        
        const originalFileSize = file.size;
        
        DEBUG.log('INFO', 'FILE_INFO', 'Selected file', {
            name: file.name,
            size: (file.size / 1024 / 1024).toFixed(2) + ' MB',
            type: file.type
        });
        
        // Get user options from UI
        const convertPageFormat = document.querySelector('input[name="page-format"]:checked')?.value || 'double';
        const convertRemoveFirstLeft = document.getElementById('remove-first-left')?.checked || false;
        const skipFirstPage = document.getElementById('skip-first-page').checked;
        const quality = parseFloat(document.getElementById('quality-select').value);
        
        DEBUG.log('INFO', 'USER_OPTIONS', 'Conversion options', {
            pageFormat: convertPageFormat,
            removeFirstLeft: convertRemoveFirstLeft,
            skipFirstPage,
            quality
        });
        
        // STEP 1: COMPRESSION (if file is large)
        if (shouldCompressPDF(file)) {
            const progressText = progressDiv.querySelector('.text-white');
            if (progressText) {
                progressText.textContent = '🗜️ Compression en cours...';
            }
            
            DEBUG.log('INFO', 'CONVERTER_COMPRESS', 'Starting compression', {
                originalSize: (originalFileSize / 1024 / 1024).toFixed(2) + ' MB'
            });
            
            const progressCallback = (message, percent) => {
                if (progressText) {
                    progressText.textContent = message;
                }
            };
            
            const { compressedFile, originalSize, compressedSize, compressionRatio } = await compressPDF(file, progressCallback);
            
            file = compressedFile;
            
            DEBUG.log('SUCCESS', 'CONVERTER_COMPRESS', 'Compression completed', {
                originalSize: (originalSize / 1024 / 1024).toFixed(2) + ' MB',
                compressedSize: (compressedSize / 1024 / 1024).toFixed(2) + ' MB',
                ratio: compressionRatio + '%'
            });
        }
        
        // STEP 2: Read PDF with pdf.js
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const sourcePdf = await loadingTask.promise;
        
        const pageCount = sourcePdf.numPages;
        
        // Use the splitPDFPages function with progress callback
        const { pdfDoc: newPdfDoc, stats } = await splitPDFPages(sourcePdf, {
            pageFormat: convertPageFormat,
            removeFirstLeft: convertRemoveFirstLeft,
            skipFirstPage: skipFirstPage,
            quality: quality,
            progressCallback: (progress, currentPage, total) => {
                const progressText = progressDiv.querySelector('.text-white');
                if (progressText) {
                    progressText.textContent = `Conversion en cours... ${progress}% (page ${currentPage}/${total})`;
                }
            }
        });
        
        DEBUG.log('SUCCESS', 'SPLIT_STATS', 'Split statistics', stats);
        
        // Save the PDF
        DEBUG.startTimer('PDF Save');
        const pdfBytes = await newPdfDoc.save();
        DEBUG.endTimer('PDF Save');
        
        convertedPDFBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        convertedFilename = file.name.replace('.pdf', '_livret_A5.pdf');
        
        const fileSizeMB = (pdfBytes.length / 1024 / 1024).toFixed(2);
        const originalSizeMB = (originalFileSize / 1024 / 1024).toFixed(2);
        const finalSizeMB = (pdfBytes.length / 1024 / 1024).toFixed(2);
        const totalCompressionRatio = ((1 - pdfBytes.length / originalFileSize) * 100).toFixed(1);
        
        DEBUG.log('SUCCESS', 'FILE_SIZES', 'Size comparison', {
            original: originalSizeMB + ' MB',
            final: finalSizeMB + ' MB',
            totalCompression: totalCompressionRatio + '%',
            outputPages: stats.outputPages
        });
        
        const pageText = convertPageFormat === 'single' 
            ? `${stats.outputPages} pages conservées`
            : `${stats.outputPages} pages créées`;
        
        DEBUG.log('SUCCESS', 'CONVERTER_COMPLETE', 'Conversion process finished successfully', null);
        DEBUG.groupEnd();
        
        // Hide progress, show success
        progressDiv.classList.add('hidden');
        successDiv.classList.remove('hidden');
        
    } catch (error) {
        console.error('Conversion error:', error);
        progressDiv.classList.add('hidden');
        errorDiv.classList.remove('hidden');
        errorMessage.textContent = error.message || 'Une erreur est survenue lors de la conversion';
    }
}

// Download converted PDF
function downloadConvertedPDF() {
    if (!convertedPDFBlob) return;
    
    const url = URL.createObjectURL(convertedPDFBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = convertedFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Converter tags management
let converterTags = [];

function addConverterTag() {
    const input = document.getElementById('converter-tag-input');
    const tag = input.value.trim();
    
    if (!tag) return;
    if (converterTags.includes(tag)) {
        alert('Ce tag existe déjà');
        return;
    }
    
    converterTags.push(tag);
    input.value = '';
    updateConverterTagsDisplay();
}

function removeConverterTag(tag) {
    converterTags = converterTags.filter(t => t !== tag);
    updateConverterTagsDisplay();
}

function updateConverterTagsDisplay() {
    const container = document.getElementById('converter-tags-container');
    
    if (converterTags.length === 0) {
        container.innerHTML = '<span class="text-gray-500 text-sm italic">Aucun tag</span>';
    } else {
        container.innerHTML = converterTags.map(tag => `
            <span class="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm">
                ${tag}
                <button onclick="removeConverterTag('${tag}')" class="hover:text-red-300" type="button">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }
}

// Upload converted PDF to library
async function uploadConvertedToLibrary() {
    if (!convertedPDFBlob) return;
    
    const uploadBtn = document.getElementById('upload-library-btn');
    const uploadBtnText = document.getElementById('upload-btn-text');
    const progressContainer = document.getElementById('upload-progress-container');
    const progressBar = document.getElementById('upload-progress-bar');
    const percentage = document.getElementById('upload-percentage');
    const completeMessage = document.getElementById('upload-complete-message');
    const descriptionInput = document.getElementById('converter-description');
    const folderInput = document.getElementById('converter-folder');
    
    try {
        // Disable button and show progress
        uploadBtn.disabled = true;
        uploadBtnText.textContent = 'Upload en cours...';
        progressContainer.classList.remove('hidden');
        completeMessage.classList.add('hidden');
        
        // Get metadata
        const description = descriptionInput.value || 'Document converti en format livret A5';
        const folder = folderInput.value.trim();
        const tags = converterTags;
        
        // Estimate upload time based on file size (more realistic)
        const fileSizeMB = convertedPDFBlob.size / (1024 * 1024);
        const estimatedTimeMs = Math.max(2000, fileSizeMB * 300); // ~300ms per MB, min 2s
        const updateInterval = estimatedTimeMs / 90; // Update every ~1% of estimated time
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 1;
            if (progress <= 90) {
                progressBar.style.width = `${progress}%`;
                percentage.textContent = `${progress}%`;
            }
        }, updateInterval);
        
        const formData = new FormData();
        formData.append('file', convertedPDFBlob, convertedFilename);
        formData.append('description', description);
        formData.append('folder', folder);
        formData.append('tags', JSON.stringify(tags));
        
        const response = await fetch('/api/admin/upload', {
            method: 'POST',
            body: formData
        });
        
        const data = await response.json();
        
        // Clear progress interval
        clearInterval(progressInterval);
        
        if (data.success) {
            // Update metadata with folder and tags
            await fetch(`/api/admin/documents/${data.token}/description`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folder, tags })
            });
            
            // Complete progress bar
            progressBar.style.width = '100%';
            percentage.textContent = '100%';
            
            // Reset converter tags for next conversion
            converterTags = [];
            updateConverterTagsDisplay();
            
            // Show success message
            setTimeout(() => {
                progressContainer.classList.add('hidden');
                completeMessage.classList.remove('hidden');
                uploadBtn.disabled = false;
                uploadBtnText.textContent = 'Déjà ajouté';
                uploadBtn.classList.remove('bg-green-600', 'hover:bg-green-700');
                uploadBtn.classList.add('bg-gray-600', 'cursor-not-allowed');
                
                // Switch to library tab after 2 seconds
                setTimeout(() => {
                    switchTab('library');
                }, 2000);
            }, 500);
        } else {
            clearInterval(progressInterval);
            progressContainer.classList.add('hidden');
            uploadBtn.disabled = false;
            uploadBtnText.textContent = 'Réessayer';
            alert('✗ Erreur lors de l\'ajout à la bibliothèque');
        }
    } catch (error) {
        console.error('Upload error:', error);
        progressContainer.classList.add('hidden');
        uploadBtn.disabled = false;
        uploadBtnText.textContent = 'Réessayer';
        alert('✗ Erreur de connexion');
    }
}

// Upload form tags management
let uploadTags = [];

function addUploadTag() {
    const input = document.getElementById('pdf-tag-input');
    const tag = input.value.trim();
    
    if (!tag) return;
    if (uploadTags.includes(tag)) {
        alert('Ce tag existe déjà');
        return;
    }
    
    uploadTags.push(tag);
    input.value = '';
    updateUploadTagsDisplay();
}

function removeUploadTag(tag) {
    uploadTags = uploadTags.filter(t => t !== tag);
    updateUploadTagsDisplay();
}

function updateUploadTagsDisplay() {
    const container = document.getElementById('upload-tags-container');
    
    if (uploadTags.length === 0) {
        container.innerHTML = '<span class="text-gray-500 text-sm italic">Aucun tag</span>';
    } else {
        container.innerHTML = uploadTags.map(tag => `
            <span class="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm">
                ${tag}
                <button onclick="removeUploadTag('${tag}')" class="hover:text-red-300" type="button">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }
}

// Handle file selection and display preview
function handleFileSelection() {
    const fileInput = document.getElementById('pdf-file');
    const previewList = document.getElementById('file-preview-list');
    const files = Array.from(fileInput.files);
    
    if (files.length === 0) {
        previewList.classList.add('hidden');
        return;
    }
    
    // Show preview list
    previewList.classList.remove('hidden');
    previewList.innerHTML = `
        <div class="bg-gray-700 rounded-lg p-3 border border-gray-600">
            <div class="flex justify-between items-center mb-2">
                <span class="text-sm font-medium text-white">${files.length} fichier(s) sélectionné(s)</span>
                <span class="text-xs text-gray-400">${formatBytes(files.reduce((sum, f) => sum + f.size, 0))}</span>
            </div>
            <div class="space-y-1 max-h-40 overflow-y-auto">
                ${files.map((file, i) => `
                    <div class="flex items-center gap-2 text-sm text-gray-300 bg-gray-800 rounded px-2 py-1">
                        <i class="fas fa-file-pdf text-red-400"></i>
                        <span class="flex-1 truncate">${file.name}</span>
                        <span class="text-xs text-gray-500">${formatBytes(file.size)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Format bytes to human readable
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

async function handleUpload(e) {
    e.preventDefault();
    
    DEBUG.group('📤 UPLOAD PROCESS');
    const startTime = performance.now();
    
    const fileInput = document.getElementById('pdf-file');
    const descriptionInput = document.getElementById('pdf-description');
    const folderInput = document.getElementById('pdf-folder');
    const progressDiv = document.getElementById('upload-progress');
    const successDiv = document.getElementById('upload-success');
    
    const files = Array.from(fileInput.files);
    DEBUG.info('UPLOAD', `Files selected: ${files.length}`, { 
        files: files.map(f => ({ name: f.name, size: f.size, type: f.type }))
    });
    
    if (files.length === 0) {
        DEBUG.warn('UPLOAD', 'No files selected');
        DEBUG.groupEnd();
        return;
    }
    
    // Check if batch upload (multiple files)
    const isBatch = files.length > 1;
    DEBUG.info('UPLOAD', `Upload mode: ${isBatch ? 'BATCH' : 'SINGLE'}`);
    
    progressDiv.classList.remove('hidden');
    successDiv.classList.add('hidden');
    
    try {
        if (isBatch) {
            DEBUG.info('BATCH-UPLOAD', 'Starting batch upload process');
            
            // Check if any files need compression
            const needsCompression = files.some(f => shouldCompressPDF(f));
            DEBUG.info('BATCH-UPLOAD', `Files needing compression: ${files.filter(f => shouldCompressPDF(f)).length}/${files.length}`);
            
            // Batch upload
            progressDiv.innerHTML = `
                <div class="bg-blue-900 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                        <span class="text-white" id="batch-upload-status">Préparation des fichiers...</span>
                    </div>
                    <div class="mt-2 space-y-2" id="batch-progress-details"></div>
                </div>
            `;
            
            const statusSpan = document.getElementById('batch-upload-status');
            const detailsDiv = document.getElementById('batch-progress-details');
            
            // Get upload split options from UI
            const uploadPageFormat = document.querySelector('input[name="upload-page-format"]:checked')?.value || 'single';
            const uploadRemoveFirstLeft = document.getElementById('upload-remove-first-left')?.checked || false;
            
            DEBUG.log('INFO', 'BATCH-UPLOAD-OPTIONS', 'Split options', {
                pageFormat: uploadPageFormat,
                removeFirstLeft: uploadRemoveFirstLeft
            });
            
            // Process files: Compress → Split
            const processedFiles = [];
            let totalSaved = 0;
            
            for (let i = 0; i < files.length; i++) {
                let file = files[i];
                const originalFileSize = file.size;
                
                // STEP 1: COMPRESSION (if needed)
                if (shouldCompressPDF(file)) {
                    statusSpan.textContent = `🗜️ Compression ${i + 1}/${files.length}: ${file.name}...`;
                    detailsDiv.innerHTML += `<div class="text-sm text-yellow-300">🗜️ Compression: ${file.name} (${formatBytes(file.size)})</div>`;
                    
                    const progressCallback = (message, percent) => {
                        statusSpan.textContent = `🗜️ [${i + 1}/${files.length}] ${message}`;
                    };
                    
                    const { compressedFile, originalSize, compressedSize, compressionRatio } = await compressPDF(file, progressCallback);
                    
                    file = compressedFile;
                    totalSaved += (originalSize - compressedSize);
                    
                    detailsDiv.innerHTML += `<div class="text-sm text-green-300">✅ Compressé: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${compressionRatio}%)</div>`;
                } else {
                    detailsDiv.innerHTML += `<div class="text-sm text-gray-300">✓ ${file.name}: ${formatBytes(file.size)} (aucune compression nécessaire)</div>`;
                }
                
                // STEP 2: SPLIT (if pages doubles selected)
                if (uploadPageFormat === 'double') {
                    statusSpan.textContent = `📄 Split pages ${i + 1}/${files.length}: ${file.name}...`;
                    detailsDiv.innerHTML += `<div class="text-sm text-cyan-300">📄 Split en pages doubles...</div>`;
                    
                    // Read PDF with pdf.js
                    const arrayBuffer = await file.arrayBuffer();
                    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                    const sourcePdf = await loadingTask.promise;
                    
                    // Apply split
                    const { pdfDoc: splitPdfDoc, stats } = await splitPDFPages(sourcePdf, {
                        pageFormat: uploadPageFormat,
                        removeFirstLeft: uploadRemoveFirstLeft,
                        skipFirstPage: false,
                        quality: 0.85,
                        progressCallback: (progress, currentPage, total) => {
                            statusSpan.textContent = `📄 Split ${i + 1}/${files.length}: ${progress}% (page ${currentPage}/${total})`;
                        }
                    });
                    
                    // Save split PDF
                    const splitPdfBytes = await splitPdfDoc.save();
                    const splitFilename = file.name.replace('.pdf', '_split.pdf');
                    file = new File([splitPdfBytes], splitFilename, { type: 'application/pdf' });
                    
                    detailsDiv.innerHTML += `<div class="text-sm text-green-300">✅ Split: ${stats.sourcePages} → ${stats.outputPages} pages</div>`;
                    
                    DEBUG.log('SUCCESS', 'BATCH-SPLIT', `File ${i + 1} split completed`, stats);
                }
                
                processedFiles.push(file);
            }
            
            if (totalSaved > 0) {
                DEBUG.success('BATCH-UPLOAD', `Total compression savings: ${formatBytes(totalSaved)}`);
                detailsDiv.innerHTML += `<div class="text-sm text-green-400 font-semibold mt-2">💾 Espace économisé: ${formatBytes(totalSaved)}</div>`;
            }
            
            statusSpan.textContent = '📤 Upload vers le serveur...';
            
            const formData = new FormData();
            processedFiles.forEach(file => {
                DEBUG.debug('BATCH-UPLOAD', `Adding file to FormData: ${file.name} (${formatBytes(file.size)})`);
                formData.append('files', file);
            });
            formData.append('description', descriptionInput.value);
            DEBUG.info('BATCH-UPLOAD', `FormData prepared with ${processedFiles.length} files`);
            
            DEBUG.startTimer('BATCH-UPLOAD-API');
            const uploadStartTime = performance.now();
            const response = await fetch('/api/admin/batch-upload', {
                method: 'POST',
                body: formData
            });
            DEBUG.endTimer('BATCH-UPLOAD-API');
            
            DEBUG.info('BATCH-UPLOAD', `API response status: ${response.status}`);
            const data = await response.json();
            DEBUG.info('BATCH-UPLOAD', 'API response data', data);
            
            if (data.success) {
                const uploadDuration = performance.now() - uploadStartTime;
                DEBUG.success('BATCH-UPLOAD', `Upload completed in ${Math.round(uploadDuration)}ms`);
                DEBUG.info('BATCH-UPLOAD', `Results: ${data.uploaded} uploaded, ${data.failed} failed`);
                // Update metadata for all uploaded files
                const updatePromises = data.results.map(result => 
                    fetch(`/api/admin/documents/${result.token}/description`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ 
                            folder: folderInput.value.trim(), 
                            tags: uploadTags 
                        })
                    })
                );
                
                await Promise.all(updatePromises);
                
                // Show success summary with AI analysis prompt
                successDiv.innerHTML = `
                    <div class="bg-green-900 border border-green-700 rounded-lg p-4">
                        <div class="flex items-start gap-3 mb-3">
                            <i class="fas fa-check-circle text-green-400 text-xl"></i>
                            <div class="flex-1">
                                <p class="text-white font-semibold mb-2">Upload par lot réussi !</p>
                                <div class="text-sm text-gray-300">
                                    <p>✅ ${data.uploaded} fichiers uploadés</p>
                                    ${data.failed > 0 ? `<p class="text-red-400">❌ ${data.failed} échecs</p>` : ''}
                                </div>
                            </div>
                        </div>
                        <div class="border-t border-green-700 pt-3">
                            <p class="text-white text-sm mb-2">
                                <i class="fas fa-magic text-purple-400 mr-2"></i>
                                Voulez-vous analyser ces documents avec l'IA maintenant ?
                            </p>
                            <div class="flex gap-2">
                                <button 
                                    onclick="openBatchAnalyze(); document.getElementById('upload-success').classList.add('hidden');"
                                    class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
                                >
                                    <i class="fas fa-play mr-2"></i>
                                    Analyser par lot
                                </button>
                                <button 
                                    onclick="document.getElementById('upload-success').classList.add('hidden');"
                                    class="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition text-sm"
                                >
                                    Plus tard
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                successDiv.classList.remove('hidden');
                
                // Reset form
                fileInput.value = '';
                descriptionInput.value = '';
                folderInput.value = '';
                uploadTags = [];
                updateUploadTagsDisplay();
                document.getElementById('file-preview-list').classList.add('hidden');
                
                // Reload documents list
                setTimeout(loadDocuments, 1000);
            } else {
                alert('Erreur: ' + data.error);
            }
        } else {
            // Single file upload
            let file = files[0];
            DEBUG.info('SINGLE-UPLOAD', `File: ${file.name} (${formatBytes(file.size)})`);
            
            // Get upload split options from UI [UPDATED 2025-01-12 03:48]
            const uploadPageFormat = document.querySelector('input[name="upload-page-format"]:checked')?.value || 'single';
            const uploadRemoveFirstLeft = document.getElementById('upload-remove-first-left')?.checked || false;
            
            DEBUG.log('INFO', 'SINGLE-UPLOAD-OPTIONS', 'Split options', {
                pageFormat: uploadPageFormat,
                removeFirstLeft: uploadRemoveFirstLeft
            });
            
            // Setup progress UI
            progressDiv.innerHTML = `
                <div class="bg-blue-900 rounded-lg p-4">
                    <div class="flex items-center gap-3 mb-2">
                        <div class="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-white"></div>
                        <span class="text-white" id="single-upload-status">⏳ Traitement en cours...</span>
                    </div>
                    <div class="mt-2 space-y-2 text-sm text-gray-300" id="single-progress-details"></div>
                </div>
            `;
            
            const statusSpan = document.getElementById('single-upload-status');
            const detailsDiv = document.getElementById('single-progress-details');
            
            // STEP 1: COMPRESSION (if needed)
            if (shouldCompressPDF(file)) {
                statusSpan.textContent = '🗜️ Compression en cours...';
                detailsDiv.innerHTML = `<div class="text-yellow-300">🗜️ Fichier volumineux détecté (${formatBytes(file.size)})</div>`;
                
                const progressCallback = (message, percent) => {
                    statusSpan.textContent = message;
                };
                
                const { compressedFile, originalSize, compressedSize, compressionRatio } = await compressPDF(file, progressCallback);
                
                file = compressedFile;
                DEBUG.success('SINGLE-UPLOAD', `Compressed: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${compressionRatio}%)`);
                
                detailsDiv.innerHTML += `<div class="text-green-300">✅ Compression terminée: ${formatBytes(originalSize)} → ${formatBytes(compressedSize)} (-${compressionRatio}%)</div>`;
                detailsDiv.innerHTML += `<div class="text-green-400 font-semibold">💾 Économisé: ${formatBytes(originalSize - compressedSize)}</div>`;
            }
            
            // STEP 2: SPLIT (if pages doubles selected)
            if (uploadPageFormat === 'double') {
                statusSpan.textContent = '📄 Split en pages doubles...';
                detailsDiv.innerHTML += `<div class="text-cyan-300">📄 Découpage des pages en cours...</div>`;
                
                // Read PDF with pdf.js
                const arrayBuffer = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
                const sourcePdf = await loadingTask.promise;
                
                // Apply split
                const { pdfDoc: splitPdfDoc, stats } = await splitPDFPages(sourcePdf, {
                    pageFormat: uploadPageFormat,
                    removeFirstLeft: uploadRemoveFirstLeft,
                    skipFirstPage: false,
                    quality: 0.85,
                    progressCallback: (progress, currentPage, total) => {
                        statusSpan.textContent = `📄 Split: ${progress}% (page ${currentPage}/${total})`;
                    }
                });
                
                // Save split PDF
                const splitPdfBytes = await splitPdfDoc.save();
                const splitFilename = file.name.replace('.pdf', '_split.pdf');
                file = new File([splitPdfBytes], splitFilename, { type: 'application/pdf' });
                
                detailsDiv.innerHTML += `<div class="text-green-300">✅ Split: ${stats.sourcePages} → ${stats.outputPages} pages</div>`;
                
                DEBUG.log('SUCCESS', 'SINGLE-SPLIT', 'File split completed', stats);
            }
            
            statusSpan.textContent = '📤 Upload vers le serveur...';
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('description', descriptionInput.value);
            formData.append('folder', folderInput.value.trim());
            formData.append('tags', JSON.stringify(uploadTags));
            
            DEBUG.info('SINGLE-UPLOAD', `Uploading file: ${file.name} (${formatBytes(file.size)})`);
            const response = await fetch('/api/admin/upload', {
                method: 'POST',
                body: formData
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Update metadata with folder and tags
                await fetch(`/api/admin/documents/${data.token}/description`, {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        folder: folderInput.value.trim(), 
                        tags: uploadTags 
                    })
                });
                
                document.getElementById('share-url').value = data.shareUrl;
                successDiv.classList.remove('hidden');
                
                // Reset form
                fileInput.value = '';
                descriptionInput.value = '';
                folderInput.value = '';
                uploadTags = [];
                updateUploadTagsDisplay();
                document.getElementById('file-preview-list').classList.add('hidden');
                
                // Reload documents list
                setTimeout(loadDocuments, 1000);
            } else {
                alert('Erreur: ' + data.error);
            }
        }
    } catch (error) {
        console.error('Upload error:', error);
        alert('Erreur lors de l\'upload');
    } finally {
        progressDiv.classList.add('hidden');
    }
}

// Global state for documents and filters
let allDocuments = [];

async function loadDocuments() {
    const listDiv = document.getElementById('documents-list');
    
    try {
        const response = await fetch('/api/admin/documents');
        const data = await response.json();
        
        if (data.success) {
            allDocuments = data.documents;
            
            // Populate filters
            populateFolderFilter();
            populateTagFilter();
            
            // Display documents
            displayDocuments(allDocuments);
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        listDiv.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
                <p class="text-gray-400">Erreur lors du chargement</p>
            </div>
        `;
    }
}

function displayDocuments(documents) {
    const listDiv = document.getElementById('documents-list');
    
    if (documents.length === 0) {
        listDiv.innerHTML = `
            <div class="text-center py-12">
                <i class="fas fa-folder-open text-6xl text-gray-600 mb-4"></i>
                <p class="text-gray-400">Aucun document trouvé</p>
                <p class="text-gray-500 text-sm mt-2">Essayez de modifier les filtres ou d'ajouter un nouveau document</p>
            </div>
        `;
    } else {
        listDiv.innerHTML = documents.map(doc => renderDocument(doc)).join('');
    }
}

function populateFolderFilter() {
    const folderFilter = document.getElementById('folder-filter');
    if (!folderFilter) return;
    
    // Extract unique folders
    const folders = [...new Set(allDocuments
        .map(doc => doc.folder || '')
        .filter(f => f !== '')
    )].sort();
    
    // Rebuild options
    folderFilter.innerHTML = '<option value="">📁 Tous les dossiers</option>';
    folders.forEach(folder => {
        folderFilter.innerHTML += `<option value="${folder}">${folder}</option>`;
    });
}

function populateTagFilter() {
    const tagFilter = document.getElementById('tag-filter');
    if (!tagFilter) return;
    
    // Extract unique tags
    const tagsSet = new Set();
    allDocuments.forEach(doc => {
        try {
            const tags = JSON.parse(doc.tags || '[]');
            tags.forEach(tag => tagsSet.add(tag));
        } catch (e) {
            // Ignore parse errors
        }
    });
    
    const tags = [...tagsSet].sort();
    
    // Rebuild options
    tagFilter.innerHTML = '<option value="">🏷️ Tous les tags</option>';
    tags.forEach(tag => {
        tagFilter.innerHTML += `<option value="${tag}">${tag}</option>`;
    });
}

function filterDocuments() {
    const searchInput = document.getElementById('search-input');
    const folderFilter = document.getElementById('folder-filter');
    const tagFilter = document.getElementById('tag-filter');
    
    if (!searchInput || !folderFilter || !tagFilter) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const selectedFolder = folderFilter.value;
    const selectedTag = tagFilter.value;
    
    // Filter documents
    const filtered = allDocuments.filter(doc => {
        // Search filter
        if (searchTerm) {
            const matchSearch = 
                (doc.filename || '').toLowerCase().includes(searchTerm) ||
                (doc.description || '').toLowerCase().includes(searchTerm) ||
                (doc.tags || '').toLowerCase().includes(searchTerm) ||
                (doc.folder || '').toLowerCase().includes(searchTerm);
            
            if (!matchSearch) return false;
        }
        
        // Folder filter
        if (selectedFolder && (doc.folder || '') !== selectedFolder) {
            return false;
        }
        
        // Tag filter
        if (selectedTag) {
            try {
                const tags = JSON.parse(doc.tags || '[]');
                if (!tags.includes(selectedTag)) {
                    return false;
                }
            } catch (e) {
                return false;
            }
        }
        
        return true;
    });
    
    displayDocuments(filtered);
}

function clearFilters() {
    const searchInput = document.getElementById('search-input');
    const folderFilter = document.getElementById('folder-filter');
    const tagFilter = document.getElementById('tag-filter');
    
    if (searchInput) searchInput.value = '';
    if (folderFilter) folderFilter.value = '';
    if (tagFilter) tagFilter.value = '';
    
    filterDocuments();
}

function renderDocument(doc) {
    const uploadDate = new Date(doc.created_at).toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
    
    const shareUrl = `${window.location.origin}/view?doc=${doc.token}`;
    
    // Parse tags
    let tags = [];
    try {
        tags = JSON.parse(doc.tags || '[]');
    } catch (e) {
        tags = [];
    }
    
    // Parse client_tags
    let clientTags = [];
    try {
        clientTags = JSON.parse(doc.client_tags || '[]');
    } catch (e) {
        clientTags = [];
    }
    
    // Render tags badges
    const tagsHtml = tags.length > 0 
        ? tags.map(tag => `<span class="inline-block bg-blue-600 text-white text-xs px-2 py-1 rounded">${tag}</span>`).join(' ')
        : '<span class="text-gray-500 text-xs italic">Aucun tag</span>';
    
    // Render client_tags badges
    const clientTagsHtml = clientTags.length > 0 
        ? clientTags.map(tag => `<span class="inline-block bg-indigo-600 text-white text-xs px-2 py-1 rounded"><i class="fas fa-user mr-1"></i>${tag}</span>`).join(' ')
        : '<span class="text-gray-500 text-xs italic">Aucun tag client</span>';
    
    // Render folder badge
    const folderHtml = doc.folder 
        ? `<span class="inline-block bg-purple-600 text-white text-xs px-2 py-1 rounded"><i class="fas fa-folder mr-1"></i>${doc.folder}</span>`
        : '<span class="text-gray-500 text-xs italic">Aucun dossier</span>';
    
    return `
        <div class="bg-gray-700 rounded-lg p-4 mb-4 border border-gray-600 hover:border-blue-500 transition">
            <div class="flex items-start justify-between">
                <div class="flex-1">
                    <h3 class="text-white font-semibold text-lg mb-1 flex items-center gap-2">
                        <i class="fas fa-file-pdf text-red-400"></i>
                        ${doc.filename}
                    </h3>
                    
                    <!-- Description -->
                    <div class="mb-2">
                        <p class="text-gray-400 text-sm ${!doc.description ? 'italic' : ''}">${doc.description || 'Aucune description'}</p>
                    </div>
                    
                    <!-- Folder, Tags, and Client Tags -->
                    <div class="mb-2 space-y-1">
                        <div class="flex items-center gap-2">
                            <span class="text-gray-500 text-xs font-semibold">Dossier:</span>
                            ${folderHtml}
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-gray-500 text-xs font-semibold">Tags:</span>
                            ${tagsHtml}
                        </div>
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="text-gray-500 text-xs font-semibold">Tags Client:</span>
                            ${clientTagsHtml}
                        </div>
                    </div>
                    
                    <div class="flex gap-4 text-sm text-gray-500">
                        <span><i class="fas fa-calendar mr-1"></i>${uploadDate}</span>
                        <span><i class="fas fa-eye mr-1"></i>${doc.views || 0} vues</span>
                        <span><i class="fas fa-database mr-1"></i>${formatFileSize(doc.size)}</span>
                    </div>
                </div>
                
                <div class="flex gap-2">
                    <button 
                        onclick="showShareModal('${doc.token}', '${doc.filename.replace(/'/g, "\\'")}')"
                        class="bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded transition"
                        title="Partager (QR Code + Iframe)"
                    >
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button 
                        onclick="openConvertModal('${doc.token}', '${doc.filename.replace(/'/g, "\\'")}')"
                        class="bg-orange-600 hover:bg-orange-700 text-white px-3 py-2 rounded transition"
                        title="Convertir (Split pages, format livret)"
                    >
                        <i class="fas fa-cog"></i>
                    </button>
                    <button 
                        onclick="openEditModal('${doc.token}')"
                        class="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-2 rounded transition"
                        title="Éditer (description, tags, dossier)"
                    >
                        <i class="fas fa-edit"></i>
                    </button>
                    <button 
                        onclick="openClientTagsModal('${doc.token}')"
                        class="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded transition"
                        title="Tags Client (classement personnalisé)"
                    >
                        <i class="fas fa-tags"></i>
                    </button>
                    <button 
                        onclick="copyToClipboard('${shareUrl}')"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded transition"
                        title="Copier le lien"
                    >
                        <i class="fas fa-link"></i>
                    </button>
                    <a 
                        href="${shareUrl}" 
                        target="_blank"
                        class="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded transition"
                        title="Ouvrir"
                    >
                        <i class="fas fa-external-link-alt"></i>
                    </a>
                    <button 
                        onclick="deleteDocument('${doc.token}', '${doc.filename}')"
                        class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded transition"
                        title="Supprimer"
                    >
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Edit modal functions
function openEditModal(token) {
    // Find document in global state
    const doc = allDocuments.find(d => d.token === token);
    if (!doc) return;
    
    // Parse current tags
    let tags = [];
    try {
        tags = JSON.parse(doc.tags || '[]');
    } catch (e) {
        tags = [];
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'edit-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-700">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i class="fas fa-edit text-yellow-400"></i>
                        Éditer le document
                    </h2>
                    <div class="flex items-center gap-3">
                        <button onclick="reanalyzeDocument('${token}')" 
                                class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition flex items-center gap-2">
                            <i class="fas fa-magic"></i>
                            🔄 Ré-analyser
                        </button>
                        <button onclick="closeEditModal()" class="text-gray-400 hover:text-white">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                </div>
                
                <div class="space-y-4">
                    <!-- Filename (editable) -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Nom du fichier</label>
                        <input 
                            type="text" 
                            id="modal-filename"
                            value="${doc.filename}"
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Formation_Module1.pdf"
                        />
                        <p class="text-gray-500 text-xs mt-1">⚠️ Le fichier physique reste inchangé dans R2, seul le nom affiché sera modifié</p>
                    </div>
                    
                    <!-- Description -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                        <textarea 
                            id="modal-description"
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            rows="3"
                            placeholder="Description du document"
                        >${doc.description || ''}</textarea>
                    </div>
                    
                    <!-- Folder -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Dossier</label>
                        <input 
                            type="text" 
                            id="modal-folder"
                            value="${doc.folder || ''}"
                            class="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                            placeholder="Ex: Formation/Bancassurance"
                        />
                        <p class="text-gray-500 text-xs mt-1">💡 Utilisez "/" pour créer une hiérarchie (ex: Formation/Module1)</p>
                    </div>
                    
                    <!-- Tags -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tags</label>
                        <div class="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                id="modal-tag-input"
                                class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500"
                                placeholder="Ajouter un tag"
                                onkeypress="if(event.key === 'Enter') { event.preventDefault(); addTagToModal(); }"
                            />
                            <button 
                                onclick="addTagToModal()"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition"
                            >
                                <i class="fas fa-plus mr-1"></i> Ajouter
                            </button>
                        </div>
                        <div id="modal-tags-container" class="flex flex-wrap gap-2 min-h-[40px] p-3 bg-gray-700 rounded-lg border border-gray-600">
                            ${tags.length > 0 
                                ? tags.map(tag => `
                                    <span class="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm">
                                        ${tag}
                                        <button onclick="removeTagFromModal('${tag}')" class="hover:text-red-300">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </span>
                                `).join('')
                                : '<span class="text-gray-500 text-sm italic">Aucun tag</span>'
                            }
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button 
                        onclick="saveDocumentMetadata('${token}')"
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                    >
                        <i class="fas fa-save mr-2"></i>
                        Enregistrer
                    </button>
                    <button 
                        onclick="closeEditModal()"
                        class="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg transition"
                    >
                        <i class="fas fa-times mr-2"></i>
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store current tags in memory
    window.currentModalTags = [...tags];
}

function closeEditModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.remove();
    window.currentModalTags = null;
}

function addTagToModal() {
    const input = document.getElementById('modal-tag-input');
    const tag = input.value.trim();
    
    if (!tag) return;
    
    // Check if tag already exists
    if (window.currentModalTags.includes(tag)) {
        alert('Ce tag existe déjà');
        return;
    }
    
    // Add tag
    window.currentModalTags.push(tag);
    input.value = '';
    
    // Update display
    updateModalTagsDisplay();
}

function removeTagFromModal(tag) {
    window.currentModalTags = window.currentModalTags.filter(t => t !== tag);
    updateModalTagsDisplay();
}

function updateModalTagsDisplay() {
    const container = document.getElementById('modal-tags-container');
    
    if (window.currentModalTags.length === 0) {
        container.innerHTML = '<span class="text-gray-500 text-sm italic">Aucun tag</span>';
    } else {
        container.innerHTML = window.currentModalTags.map(tag => `
            <span class="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded text-sm">
                ${tag}
                <button onclick="removeTagFromModal('${tag}')" class="hover:text-red-300">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }
}

async function saveDocumentMetadata(token) {
    const filename = document.getElementById('modal-filename').value.trim();
    const description = document.getElementById('modal-description').value.trim();
    const folder = document.getElementById('modal-folder').value.trim();
    const tags = window.currentModalTags || [];
    
    // Validation du filename
    if (!filename) {
        alert('Le nom du fichier ne peut pas être vide');
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/documents/${token}/description`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                filename,
                description, 
                folder, 
                tags 
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Close modal
            closeEditModal();
            
            // Show success feedback
            const successMsg = document.createElement('div');
            successMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            successMsg.innerHTML = '<i class="fas fa-check mr-2"></i>Document mis à jour !';
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
                successMsg.remove();
            }, 3000);
            
            // Reload documents
            await loadDocuments();
        } else {
            alert('Erreur lors de la mise à jour');
        }
    } catch (error) {
        console.error('Error updating document:', error);
        alert('Erreur de connexion');
    }
}

// ==========================================
// CLIENT TAGS MODAL FUNCTIONS
// ==========================================

async function openClientTagsModal(token) {
    // Find document in global state
    const doc = allDocuments.find(d => d.token === token);
    if (!doc) return;
    
    // Parse current client_tags
    let clientTags = [];
    try {
        clientTags = JSON.parse(doc.client_tags || '[]');
    } catch (e) {
        clientTags = [];
    }
    
    // Fetch all existing client_tags for autocomplete
    let allClientTags = [];
    try {
        const response = await fetch('/api/admin/client-tags');
        const data = await response.json();
        if (data.success) {
            allClientTags = data.tags;
        }
    } catch (error) {
        console.error('Error fetching client tags:', error);
    }
    
    // Create modal
    const modal = document.createElement('div');
    modal.id = 'client-tags-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full border border-gray-700">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i class="fas fa-tags text-indigo-400"></i>
                        Tags Client - ${doc.filename}
                    </h2>
                    <button onclick="closeClientTagsModal()" class="text-gray-400 hover:text-white">
                        <i class="fas fa-times text-2xl"></i>
                    </button>
                </div>
                
                <div class="bg-indigo-900 bg-opacity-30 border border-indigo-700 rounded-lg p-4 mb-6">
                    <p class="text-indigo-200 text-sm">
                        <i class="fas fa-info-circle mr-2"></i>
                        <strong>Tags Client</strong> : Étiquettes personnalisées pour organiser vos documents par client, projet, ou toute autre classification personnelle.
                    </p>
                    <p class="text-indigo-300 text-xs mt-2">
                        💡 Ces tags sont indépendants des tags de contenu et des dossiers.
                    </p>
                </div>
                
                <div class="space-y-4">
                    <!-- Client Tags Input -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Ajouter un tag client</label>
                        <div class="flex gap-2 mb-2">
                            <input 
                                type="text" 
                                id="client-tag-input"
                                list="client-tags-datalist"
                                class="flex-1 px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
                                placeholder="Ex: Client A, Urgent, Q4 2024..."
                                onkeypress="if(event.key === 'Enter') { event.preventDefault(); addClientTagToModal(); }"
                            />
                            <datalist id="client-tags-datalist">
                                ${allClientTags.map(tag => `<option value="${tag}">`).join('')}
                            </datalist>
                            <button 
                                onclick="addClientTagToModal()"
                                class="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition"
                            >
                                <i class="fas fa-plus mr-1"></i> Ajouter
                            </button>
                        </div>
                        <p class="text-gray-500 text-xs">
                            💡 Utilisez l'auto-complétion pour choisir parmi les tags existants
                        </p>
                    </div>
                    
                    <!-- Current Client Tags -->
                    <div>
                        <label class="block text-sm font-medium text-gray-300 mb-2">Tags actuels</label>
                        <div id="client-tags-container" class="flex flex-wrap gap-2 min-h-[60px] p-3 bg-gray-700 rounded-lg border border-gray-600">
                            ${clientTags.length > 0 
                                ? clientTags.map(tag => `
                                    <span class="inline-flex items-center gap-1 bg-indigo-600 text-white px-3 py-1 rounded text-sm">
                                        <i class="fas fa-user text-xs"></i>
                                        ${tag}
                                        <button onclick="removeClientTagFromModal('${tag.replace(/'/g, "\\'")}');" class="hover:text-red-300">
                                            <i class="fas fa-times"></i>
                                        </button>
                                    </span>
                                `).join('')
                                : '<span class="text-gray-500 text-sm italic">Aucun tag client</span>'
                            }
                        </div>
                    </div>
                </div>
                
                <div class="flex gap-3 mt-6">
                    <button 
                        onclick="saveClientTags('${token}')"
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition"
                    >
                        <i class="fas fa-save mr-2"></i>
                        Enregistrer
                    </button>
                    <button 
                        onclick="closeClientTagsModal()"
                        class="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg transition"
                    >
                        <i class="fas fa-times mr-2"></i>
                        Annuler
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Store current client_tags in memory
    window.currentClientTags = [...clientTags];
}

function closeClientTagsModal() {
    const modal = document.getElementById('client-tags-modal');
    if (modal) modal.remove();
    window.currentClientTags = null;
}

function addClientTagToModal() {
    const input = document.getElementById('client-tag-input');
    const tag = input.value.trim();
    
    if (!tag) return;
    
    // Check if tag already exists
    if (window.currentClientTags.includes(tag)) {
        alert('Ce tag client existe déjà pour ce document');
        return;
    }
    
    // Add tag
    window.currentClientTags.push(tag);
    input.value = '';
    
    // Update display
    updateClientTagsDisplay();
}

function removeClientTagFromModal(tag) {
    window.currentClientTags = window.currentClientTags.filter(t => t !== tag);
    updateClientTagsDisplay();
}

function updateClientTagsDisplay() {
    const container = document.getElementById('client-tags-container');
    
    if (window.currentClientTags.length === 0) {
        container.innerHTML = '<span class="text-gray-500 text-sm italic">Aucun tag client</span>';
    } else {
        container.innerHTML = window.currentClientTags.map(tag => `
            <span class="inline-flex items-center gap-1 bg-indigo-600 text-white px-3 py-1 rounded text-sm">
                <i class="fas fa-user text-xs"></i>
                ${tag}
                <button onclick="removeClientTagFromModal('${tag.replace(/'/g, "\\'")}')" class="hover:text-red-300">
                    <i class="fas fa-times"></i>
                </button>
            </span>
        `).join('');
    }
}

async function saveClientTags(token) {
    const clientTags = window.currentClientTags || [];
    
    try {
        const response = await fetch(`/api/admin/documents/${token}/client-tags`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ client_tags: clientTags })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Close modal
            closeClientTagsModal();
            
            // Show success feedback
            const successMsg = document.createElement('div');
            successMsg.className = 'fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg z-50';
            successMsg.innerHTML = '<i class="fas fa-check mr-2"></i>Tags client mis à jour !';
            document.body.appendChild(successMsg);
            
            setTimeout(() => {
                successMsg.remove();
            }, 3000);
            
            // Reload documents
            await loadDocuments();
        } else {
            alert('Erreur lors de la mise à jour des tags client');
        }
    } catch (error) {
        console.error('Error updating client tags:', error);
        alert('Erreur de connexion');
    }
}

// Share modal functions
function showShareModal(token, filename) {
    const shareUrl = `${window.location.origin}/view?doc=${token}`;
    const modal = document.getElementById('share-modal');
    const content = document.getElementById('share-modal-content');
    
    content.innerHTML = `
        <div class="space-y-6">
            <!-- Document Info -->
            <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 class="text-white font-semibold mb-2">
                    <i class="fas fa-file-pdf text-red-400 mr-2"></i>${filename}
                </h3>
                <p class="text-gray-400 text-sm">Token: ${token}</p>
            </div>
            
            <!-- Direct Link -->
            <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-white font-semibold flex items-center gap-2">
                        <i class="fas fa-link text-blue-400"></i>
                        Lien Direct
                    </h3>
                    <button 
                        onclick="copyToClipboard('${shareUrl}')"
                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                    >
                        <i class="fas fa-copy mr-1"></i> Copier
                    </button>
                </div>
                <input 
                    type="text" 
                    value="${shareUrl}" 
                    readonly 
                    class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                    onclick="this.select()"
                />
                <p class="text-gray-400 text-xs mt-2">
                    <i class="fas fa-info-circle mr-1"></i>
                    Partagez ce lien avec vos stagiaires pour un accès direct au document
                </p>
            </div>
            
            <!-- QR Code -->
            <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
                    <i class="fas fa-qrcode text-green-400"></i>
                    QR Code (Accès Mobile)
                </h3>
                <div class="flex flex-col md:flex-row gap-4 items-center">
                    <div id="qrcode-${token}" class="bg-white p-4 rounded-lg"></div>
                    <div class="flex-1">
                        <p class="text-gray-300 text-sm mb-3">
                            Scannez ce QR code avec un smartphone pour ouvrir le document directement sur mobile.
                        </p>
                        <button 
                            onclick="downloadQRCode('${token}', '${filename.replace(/'/g, "\\'")}')"
                            class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition w-full md:w-auto"
                        >
                            <i class="fas fa-download mr-2"></i>
                            Télécharger le QR Code
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Iframe Embed Code -->
            <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <div class="flex justify-between items-center mb-3">
                    <h3 class="text-white font-semibold flex items-center gap-2">
                        <i class="fas fa-code text-orange-400"></i>
                        Code d'Intégration (Iframe)
                    </h3>
                    <button 
                        onclick="copyIframeCode('${token}')"
                        class="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded text-sm transition"
                    >
                        <i class="fas fa-copy mr-1"></i> Copier
                    </button>
                </div>
                <textarea 
                    id="iframe-code-${token}"
                    readonly 
                    class="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm font-mono h-32"
                    onclick="this.select()"
                ><iframe src="${shareUrl}" width="100%" height="800" frameborder="0" allowfullscreen style="border: 1px solid #ccc; border-radius: 8px;"></iframe></textarea>
                <p class="text-gray-400 text-xs mt-2">
                    <i class="fas fa-info-circle mr-1"></i>
                    Intégrez ce code HTML dans votre page web pour afficher le document en plein écran
                </p>
                
                <!-- Iframe Options -->
                <div class="mt-4 space-y-2">
                    <label class="flex items-center gap-2 text-gray-300 text-sm">
                        <input type="checkbox" id="iframe-fullscreen-${token}" checked onchange="updateIframeCode('${token}', '${shareUrl}')">
                        <span>Autoriser le plein écran</span>
                    </label>
                    <div class="flex gap-4">
                        <div class="flex-1">
                            <label class="block text-gray-400 text-xs mb-1">Largeur</label>
                            <input 
                                type="text" 
                                id="iframe-width-${token}" 
                                value="100%" 
                                onchange="updateIframeCode('${token}', '${shareUrl}')"
                                class="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                            />
                        </div>
                        <div class="flex-1">
                            <label class="block text-gray-400 text-xs mb-1">Hauteur (px)</label>
                            <input 
                                type="number" 
                                id="iframe-height-${token}" 
                                value="800" 
                                onchange="updateIframeCode('${token}', '${shareUrl}')"
                                class="w-full px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white text-sm"
                            />
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Preview -->
            <div class="bg-gray-700 rounded-lg p-4 border border-gray-600">
                <h3 class="text-white font-semibold mb-3 flex items-center gap-2">
                    <i class="fas fa-eye text-cyan-400"></i>
                    Aperçu Iframe
                </h3>
                <div class="bg-gray-900 rounded-lg p-2">
                    <iframe 
                        id="preview-iframe-${token}"
                        src="${shareUrl}" 
                        width="100%" 
                        height="400" 
                        frameborder="0"
                        allowfullscreen
                        style="border: 1px solid #4b5563; border-radius: 4px;"
                    ></iframe>
                </div>
            </div>
        </div>
    `;
    
    // Generate QR code
    setTimeout(() => {
        const qrContainer = document.getElementById(`qrcode-${token}`);
        if (qrContainer && typeof QRCode !== 'undefined') {
            qrContainer.innerHTML = ''; // Clear any existing QR code
            new QRCode(qrContainer, {
                text: shareUrl,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, 100);
    
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function updateIframeCode(token, shareUrl) {
    const width = document.getElementById(`iframe-width-${token}`).value;
    const height = document.getElementById(`iframe-height-${token}`).value;
    const allowFullscreen = document.getElementById(`iframe-fullscreen-${token}`).checked;
    
    const fullscreenAttr = allowFullscreen ? ' allowfullscreen' : '';
    const iframeCode = `<iframe src="${shareUrl}" width="${width}" height="${height}" frameborder="0"${fullscreenAttr} style="border: 1px solid #ccc; border-radius: 8px;"></iframe>`;
    
    document.getElementById(`iframe-code-${token}`).value = iframeCode;
    
    // Update preview
    const previewIframe = document.getElementById(`preview-iframe-${token}`);
    previewIframe.width = width;
    previewIframe.height = height;
    if (allowFullscreen) {
        previewIframe.setAttribute('allowfullscreen', '');
    } else {
        previewIframe.removeAttribute('allowfullscreen');
    }
}

function copyIframeCode(token) {
    const textarea = document.getElementById(`iframe-code-${token}`);
    textarea.select();
    document.execCommand('copy');
    
    showNotification('✓ Code iframe copié !', 'success');
}

function downloadQRCode(token, filename) {
    const qrContainer = document.getElementById(`qrcode-${token}`);
    const canvas = qrContainer.querySelector('canvas');
    
    if (canvas) {
        const link = document.createElement('a');
        link.download = `QRCode_${filename.replace('.pdf', '')}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        showNotification('✓ QR Code téléchargé !', 'success');
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 ${type === 'success' ? 'bg-green-600' : 'bg-blue-600'} text-white px-4 py-2 rounded-lg shadow-lg z-50`;
    notification.innerHTML = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    const modal = document.getElementById('share-modal');
    if (modal && e.target === modal) {
        closeShareModal();
    }
});

async function deleteDocument(token, filename) {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${filename}" ?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/documents/${token}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            loadDocuments();
        } else {
            alert('Erreur: ' + data.error);
        }
    } catch (error) {
        console.error('Delete error:', error);
        alert('Erreur lors de la suppression');
    }
}

function copyShareUrl() {
    const input = document.getElementById('share-url');
    input.select();
    document.execCommand('copy');
    alert('Lien copié dans le presse-papiers !');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        alert('Lien copié dans le presse-papiers !');
    }).catch(err => {
        console.error('Copy error:', err);
    });
}

function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

// ==========================================
// SECURITY TAB - Password Management
// ==========================================

function showSecurityContent() {
    const content = document.getElementById('security-content');
    
    content.innerHTML = `
        <div class="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 max-w-3xl mx-auto">
            <div class="flex items-center gap-3 mb-6">
                <i class="fas fa-lock text-blue-400 text-2xl"></i>
                <h2 class="text-2xl font-bold text-white">Gestion du Mot de Passe</h2>
            </div>
            
            <!-- Password Info Card -->
            <div id="password-info-card" class="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-6">
                <div class="flex items-start gap-3">
                    <div class="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-400"></div>
                    <span class="text-gray-400">Chargement des informations...</span>
                </div>
            </div>
            
            <!-- Change Password Form -->
            <form id="change-password-form" class="space-y-6">
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                        <i class="fas fa-key mr-2 text-gray-400"></i>
                        Mot de passe actuel
                    </label>
                    <input 
                        type="password" 
                        id="current-password" 
                        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Entrez votre mot de passe actuel"
                        required
                    />
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                        <i class="fas fa-lock mr-2 text-gray-400"></i>
                        Nouveau mot de passe
                    </label>
                    <input 
                        type="password" 
                        id="new-password" 
                        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Minimum 12 caractères"
                        required
                        minlength="12"
                    />
                    <div id="password-strength" class="mt-2 text-sm"></div>
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-gray-300 mb-2">
                        <i class="fas fa-check-circle mr-2 text-gray-400"></i>
                        Confirmer le nouveau mot de passe
                    </label>
                    <input 
                        type="password" 
                        id="confirm-password" 
                        class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Retapez le nouveau mot de passe"
                        required
                        minlength="12"
                    />
                </div>
                
                <!-- Password Requirements -->
                <div class="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
                    <p class="text-sm font-semibold text-blue-300 mb-2">
                        <i class="fas fa-info-circle mr-2"></i>
                        Exigences du mot de passe :
                    </p>
                    <ul class="text-sm text-gray-300 space-y-1 ml-6">
                        <li id="req-length" class="flex items-center gap-2">
                            <i class="fas fa-circle text-xs text-gray-500"></i>
                            Au moins 12 caractères
                        </li>
                        <li id="req-uppercase" class="flex items-center gap-2">
                            <i class="fas fa-circle text-xs text-gray-500"></i>
                            Au moins une lettre majuscule
                        </li>
                        <li id="req-lowercase" class="flex items-center gap-2">
                            <i class="fas fa-circle text-xs text-gray-500"></i>
                            Au moins une lettre minuscule
                        </li>
                        <li id="req-number" class="flex items-center gap-2">
                            <i class="fas fa-circle text-xs text-gray-500"></i>
                            Au moins un chiffre
                        </li>
                    </ul>
                </div>
                
                <!-- Error/Success Messages -->
                <div id="password-error" class="hidden bg-red-900 border border-red-700 rounded-lg p-4">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-exclamation-circle text-red-400 text-xl"></i>
                        <div class="flex-1">
                            <p class="text-white font-semibold">Erreur</p>
                            <p id="password-error-message" class="text-red-200 text-sm mt-1"></p>
                        </div>
                    </div>
                </div>
                
                <div id="password-success" class="hidden bg-green-900 border border-green-700 rounded-lg p-4">
                    <div class="flex items-start gap-3">
                        <i class="fas fa-check-circle text-green-400 text-xl"></i>
                        <div class="flex-1">
                            <p class="text-white font-semibold">Succès !</p>
                            <p class="text-green-200 text-sm mt-1">Votre mot de passe a été changé avec succès.</p>
                        </div>
                    </div>
                </div>
                
                <!-- Submit Button -->
                <button 
                    type="submit" 
                    class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2"
                >
                    <i class="fas fa-save"></i>
                    Changer le Mot de Passe
                </button>
            </form>
            
            <!-- Master Password Info -->
            <div class="mt-8 bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-4">
                <div class="flex items-start gap-3">
                    <i class="fas fa-shield-alt text-yellow-400 text-xl"></i>
                    <div class="flex-1">
                        <p class="text-yellow-300 font-semibold mb-1">Mot de passe maître (secours)</p>
                        <p class="text-yellow-200 text-sm">
                            Le mot de passe stocké dans les secrets Cloudflare fonctionne toujours et peut être utilisé pour récupérer l'accès en cas d'oubli du mot de passe personnalisé.
                        </p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- AI Configuration Section -->
        <div class="bg-gray-800 rounded-xl shadow-xl p-6 border border-gray-700 max-w-3xl mx-auto mt-6">
            <div class="flex items-center justify-between mb-6">
                <div class="flex items-center gap-3">
                    <i class="fas fa-robot text-purple-400 text-2xl"></i>
                    <h2 class="text-2xl font-bold text-white">Configuration de l'IA</h2>
                </div>
                
                <!-- AI Enable/Disable Toggle -->
                <label class="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" id="ai-enabled-toggle" class="sr-only peer" onchange="updateAIStatus()">
                    <div class="w-14 h-7 bg-gray-600 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-purple-600"></div>
                    <span class="ml-3 text-sm font-medium text-gray-300">Activé</span>
                </label>
            </div>
            
            <!-- AI Configuration Form (will be hidden if disabled) -->
            <div id="ai-config-form">
            <!-- Gemini API Key -->
            <div class="mb-6">
                <label class="block text-sm font-medium text-gray-300 mb-2">
                    <i class="fas fa-key mr-2 text-gray-400"></i>
                    Clé API Google Gemini
                </label>
                <div class="relative">
                    <input type="password" 
                           id="gemini-api-key" 
                           placeholder="AIza..." 
                           class="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-purple-500" />
                    <div id="api-key-status" class="hidden absolute right-3 top-1/2 transform -translate-y-1/2"></div>
                </div>
                
                <!-- API Key Status Indicator -->
                <div id="api-key-info" class="mt-2 hidden"></div>
                
                <p class="text-xs text-gray-400 mt-1">
                    <i class="fas fa-magic mr-1"></i>
                    Sélection intelligente : Flash pour texte, Pro pour images/OCR<br>
                    Obtenez votre clé gratuite sur 
                    <a href="https://makersuite.google.com/app/apikey" 
                       target="_blank" 
                       class="text-blue-400 hover:underline">
                        makersuite.google.com
                    </a>
                </p>
            </div>
            </div>
            <!-- End AI Configuration Form -->
            
            <!-- Save and Test Buttons -->
            <div class="flex gap-4 mb-6">
                <button onclick="saveAIConfig()" 
                        class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2">
                    <i class="fas fa-save"></i>
                    Enregistrer la configuration
                </button>
                
                <button onclick="testAIConfig()" 
                        class="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition flex items-center justify-center gap-2">
                    <i class="fas fa-check-circle"></i>
                    Tester la clé API
                </button>
            </div>
            
            <!-- Result Message -->
            <div id="ai-config-result" class="hidden"></div>
            
            <!-- Security Notice -->
            <div class="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
                <p class="text-sm text-blue-300">
                    <i class="fas fa-shield-alt mr-2"></i>
                    <strong>Sécurité :</strong> Les clés API sont chiffrées avec AES-256-GCM avant stockage dans Cloudflare KV. 
                    Elles ne sont jamais exposées côté client et ne peuvent pas être relues après enregistrement.
                </p>
            </div>
        </div>
    `;
    
    // Load password info
    loadPasswordInfo();
    
    // Load AI configuration
    loadAIConfig();
    
    // Setup event listeners
    setupPasswordForm();
}

async function loadPasswordInfo() {
    const infoCard = document.getElementById('password-info-card');
    
    try {
        const response = await fetch('/api/admin/password-info');
        const data = await response.json();
        
        if (data.success) {
            if (data.hasCustomPassword) {
                infoCard.innerHTML = `
                    <div class="flex items-start gap-3">
                        <i class="fas fa-check-circle text-green-400 text-xl"></i>
                        <div class="flex-1">
                            <p class="text-white font-semibold">Mot de passe personnalisé actif</p>
                            <p class="text-gray-400 text-sm mt-1">
                                Dernière modification : ${new Date(data.lastUpdated).toLocaleString('fr-FR')}
                            </p>
                        </div>
                    </div>
                `;
            } else {
                infoCard.innerHTML = `
                    <div class="flex items-start gap-3">
                        <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                        <div class="flex-1">
                            <p class="text-white font-semibold">Mot de passe par défaut</p>
                            <p class="text-gray-400 text-sm mt-1">
                                Vous utilisez actuellement le mot de passe maître (Cloudflare Secret). Changez-le pour plus de sécurité.
                            </p>
                        </div>
                    </div>
                `;
            }
        }
    } catch (error) {
        console.error('Error loading password info:', error);
        infoCard.innerHTML = `
            <div class="flex items-start gap-3">
                <i class="fas fa-exclamation-triangle text-yellow-400 text-xl"></i>
                <div class="flex-1">
                    <p class="text-white font-semibold">Erreur de chargement</p>
                    <p class="text-gray-400 text-sm mt-1">
                        Impossible de charger les informations du mot de passe.
                    </p>
                </div>
            </div>
        `;
    }
}

function setupPasswordForm() {
    const form = document.getElementById('change-password-form');
    const newPasswordInput = document.getElementById('new-password');
    const confirmPasswordInput = document.getElementById('confirm-password');
    
    // Real-time password strength indicator
    newPasswordInput.addEventListener('input', () => {
        const password = newPasswordInput.value;
        updatePasswordStrength(password);
        validatePasswordRequirements(password);
    });
    
    // Real-time password match validation
    confirmPasswordInput.addEventListener('input', () => {
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        if (confirmPassword && newPassword !== confirmPassword) {
            confirmPasswordInput.setCustomValidity('Les mots de passe ne correspondent pas');
        } else {
            confirmPasswordInput.setCustomValidity('');
        }
    });
    
    // Form submission
    form.addEventListener('submit', handlePasswordChange);
}

function validatePasswordRequirements(password) {
    const requirements = {
        length: password.length >= 12,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /[0-9]/.test(password)
    };
    
    // Update visual indicators
    Object.keys(requirements).forEach(req => {
        const element = document.getElementById(`req-${req}`);
        const icon = element.querySelector('i');
        
        if (requirements[req]) {
            icon.className = 'fas fa-check-circle text-xs text-green-400';
            element.classList.remove('text-gray-300');
            element.classList.add('text-green-300');
        } else {
            icon.className = 'fas fa-circle text-xs text-gray-500';
            element.classList.remove('text-green-300');
            element.classList.add('text-gray-300');
        }
    });
    
    return Object.values(requirements).every(v => v);
}

function updatePasswordStrength(password) {
    const strengthDiv = document.getElementById('password-strength');
    
    if (!password) {
        strengthDiv.innerHTML = '';
        return;
    }
    
    let strength = 0;
    let feedback = '';
    let color = '';
    
    // Calculate strength
    if (password.length >= 12) strength++;
    if (password.length >= 16) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    // Determine feedback
    if (strength <= 2) {
        feedback = 'Faible';
        color = 'text-red-400';
    } else if (strength <= 4) {
        feedback = 'Moyen';
        color = 'text-yellow-400';
    } else if (strength <= 5) {
        feedback = 'Bon';
        color = 'text-green-400';
    } else {
        feedback = 'Excellent';
        color = 'text-green-300';
    }
    
    const percentage = Math.min(100, (strength / 6) * 100);
    
    strengthDiv.innerHTML = `
        <div class="flex items-center gap-2">
            <span class="${color} font-semibold">Force : ${feedback}</span>
            <div class="flex-1 bg-gray-700 rounded-full h-2">
                <div class="h-2 rounded-full transition-all ${
                    strength <= 2 ? 'bg-red-500' : 
                    strength <= 4 ? 'bg-yellow-500' : 
                    'bg-green-500'
                }" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}

async function handlePasswordChange(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;
    
    const errorDiv = document.getElementById('password-error');
    const errorMessage = document.getElementById('password-error-message');
    const successDiv = document.getElementById('password-success');
    
    // Hide previous messages
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
        errorMessage.textContent = 'Les nouveaux mots de passe ne correspondent pas.';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Validate password strength
    if (!validatePasswordRequirements(newPassword)) {
        errorMessage.textContent = 'Le nouveau mot de passe ne respecte pas toutes les exigences.';
        errorDiv.classList.remove('hidden');
        return;
    }
    
    // Disable submit button
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i> Changement en cours...';
    
    try {
        const response = await fetch('/api/admin/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentPassword,
                newPassword
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Show success message
            successDiv.classList.remove('hidden');
            
            // Clear form
            e.target.reset();
            
            // Reload password info
            setTimeout(() => {
                loadPasswordInfo();
            }, 1000);
            
            // Hide success message after 5 seconds
            setTimeout(() => {
                successDiv.classList.add('hidden');
            }, 5000);
        } else {
            errorMessage.textContent = data.error || 'Erreur lors du changement de mot de passe.';
            errorDiv.classList.remove('hidden');
        }
    } catch (error) {
        console.error('Password change error:', error);
        errorMessage.textContent = 'Erreur réseau. Veuillez réessayer.';
        errorDiv.classList.remove('hidden');
    } finally {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
    }
}

// ==========================================
// AI CONFIGURATION FUNCTIONS
// ==========================================



/**
 * Load AI configuration from backend
 */
async function loadAIConfig() {
    try {
        const response = await fetch('/api/admin/ai-config');
        const data = await response.json();
        
        if (data.success) {
            // Set toggle
            document.getElementById('ai-enabled-toggle').checked = data.enabled || false;
            
            // Update API key status indicator
            updateAPIKeyStatus(data.hasGeminiKey);
            
            // Update form visibility
            updateAIStatus();
            
            // Update analyze buttons visibility globally
            updateAnalyzeButtonsVisibility();
        }
    } catch (error) {
        console.error('Load AI Config Error:', error);
    }
}

/**
 * Update API key status indicator
 */
function updateAPIKeyStatus(hasKey) {
    const infoDiv = document.getElementById('api-key-info');
    
    if (hasKey) {
        infoDiv.className = 'mt-2 p-3 rounded-lg bg-green-900 bg-opacity-30 border border-green-700';
        infoDiv.innerHTML = `
            <div class="flex items-center gap-2 text-green-300 text-sm">
                <i class="fas fa-check-circle"></i>
                <span><strong>Clé API enregistrée</strong> - Une clé Gemini est configurée et chiffrée dans le système</span>
            </div>
        `;
        infoDiv.classList.remove('hidden');
    } else {
        infoDiv.className = 'mt-2 p-3 rounded-lg bg-yellow-900 bg-opacity-30 border border-yellow-700';
        infoDiv.innerHTML = `
            <div class="flex items-center gap-2 text-yellow-300 text-sm">
                <i class="fas fa-exclamation-triangle"></i>
                <span><strong>Aucune clé API</strong> - Veuillez saisir et enregistrer une clé Gemini</span>
            </div>
        `;
        infoDiv.classList.remove('hidden');
    }
}

/**
 * Update AI form visibility when toggle changes
 */
function updateAIStatus() {
    const enabled = document.getElementById('ai-enabled-toggle').checked;
    const form = document.getElementById('ai-config-form');
    
    if (enabled) {
        form.style.display = 'block';
    } else {
        form.style.display = 'none';
    }
    
    // Update analyze buttons visibility
    updateAnalyzeButtonsVisibility();
}

/**
 * Update visibility of all AI analyze buttons
 */
async function updateAnalyzeButtonsVisibility() {
    try {
        const response = await fetch('/api/admin/ai-config');
        const data = await response.json();
        
        const shouldShow = data.success && data.enabled && data.hasGeminiKey;
        
        // Find all analyze buttons
        const analyzeButtons = document.querySelectorAll('[onclick*="analyze"]');
        analyzeButtons.forEach(button => {
            if (shouldShow) {
                button.style.display = '';
            } else {
                button.style.display = 'none';
            }
        });
    } catch (error) {
        console.error('Update Analyze Buttons Error:', error);
    }
}

/**
 * Show AI config result message
 */
function showAIConfigResult(type, message) {
    const resultDiv = document.getElementById('ai-config-result');
    resultDiv.classList.remove('hidden');
    
    if (type === 'success') {
        resultDiv.className = 'p-4 rounded-lg bg-green-900 border border-green-700 text-green-200';
    } else if (type === 'error') {
        resultDiv.className = 'p-4 rounded-lg bg-red-900 border border-red-700 text-red-200';
    } else if (type === 'loading') {
        resultDiv.className = 'p-4 rounded-lg bg-blue-900 border border-blue-700 text-blue-200';
    }
    
    resultDiv.innerHTML = message;
}

/**
 * Save AI configuration
 */
async function saveAIConfig() {
    const enabled = document.getElementById('ai-enabled-toggle').checked;
    const geminiKey = document.getElementById('gemini-api-key').value.trim();
    
    // Validation (only if enabled)
    if (enabled && !geminiKey) {
        showAIConfigResult('error', '❌ Veuillez renseigner la clé API Gemini ou désactiver l\'IA');
        return;
    }
    
    showAIConfigResult('loading', '<i class="fas fa-spinner fa-spin mr-2"></i>Enregistrement en cours...');
    
    try {
        const response = await fetch('/api/admin/set-ai-config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                enabled,
                geminiKey
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAIConfigResult('success', '✅ Configuration Gemini enregistrée avec succès !');
            
            // Clear input field
            document.getElementById('gemini-api-key').value = '';
            
            // Update API key status (show it's now saved)
            updateAPIKeyStatus(true);
            
            // Update analyze buttons visibility
            await updateAnalyzeButtonsVisibility();
            
            // Hide message after 5 seconds
            setTimeout(() => {
                document.getElementById('ai-config-result').classList.add('hidden');
            }, 5000);
        } else {
            showAIConfigResult('error', `❌ ${data.error}`);
        }
        
    } catch (error) {
        console.error('Save AI Config Error:', error);
        showAIConfigResult('error', '❌ Erreur lors de l\'enregistrement');
    }
}

/**
 * Test AI configuration
 */
async function testAIConfig() {
    showAIConfigResult('loading', '<i class="fas fa-spinner fa-spin mr-2"></i>Test en cours...');
    
    try {
        const response = await fetch('/api/admin/test-ai', {
            method: 'POST'
        });
        
        const data = await response.json();
        
        if (data.success) {
            showAIConfigResult('success', `
                ✅ Test réussi !<br>
                <strong>Provider :</strong> ${data.provider}<br>
                <strong>Réponse :</strong> ${data.sample}
            `);
        } else {
            showAIConfigResult('error', `❌ ${data.error}`);
        }
        
    } catch (error) {
        console.error('Test AI Error:', error);
        showAIConfigResult('error', '❌ Erreur lors du test');
    }
}

// ==========================================
// PDF ANALYSIS WITH AI
// ==========================================

/**
 * Extract text and thumbnail from PDF file
 */
async function extractPDFContent(file, progressCallback = null, batchMode = false) {
    const extractStartTime = performance.now();
    DEBUG.group(`📄 EXTRACT PDF: ${file.name}`);
    DEBUG.info('PDF-EXTRACT', `Mode: ${batchMode ? 'BATCH (fast)' : 'NORMAL'}`);
    DEBUG.info('PDF-EXTRACT', `File size: ${formatBytes(file.size)}`);
    
    try {
        DEBUG.startTimer('PDF-EXTRACT-arrayBuffer');
        const arrayBuffer = await file.arrayBuffer();
        DEBUG.endTimer('PDF-EXTRACT-arrayBuffer');
        DEBUG.debug('PDF-EXTRACT', `ArrayBuffer size: ${formatBytes(arrayBuffer.byteLength)}`);
        
        DEBUG.startTimer('PDF-EXTRACT-getDocument');
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        DEBUG.endTimer('PDF-EXTRACT-getDocument');
        
        const totalPages = pdf.numPages;
        DEBUG.info('PDF-EXTRACT', `Total pages: ${totalPages}`);
        
        // Intelligent sampling strategy based on document size
        let textPagesToExtract, ocrPagesToExtract;
        
        // BATCH MODE: Smart sampling - extract more pages if needed to get enough text
        if (batchMode) {
            // Start with 1 page, will sample more if text is insufficient
            textPagesToExtract = Math.min(5, totalPages);  // Maximum 5 pages in batch mode
            ocrPagesToExtract = 0;   // NO OCR in batch mode (too slow)
            DEBUG.info('PDF-EXTRACT', `⚡ BATCH MODE: up to ${textPagesToExtract} pages, no OCR`);
        } else if (totalPages <= 5) {
            textPagesToExtract = totalPages;  // All pages
            ocrPagesToExtract = Math.min(3, totalPages);
            DEBUG.info('PDF-EXTRACT', `Strategy: All ${totalPages} pages, OCR ${ocrPagesToExtract}`);
        } else if (totalPages <= 20) {
            textPagesToExtract = 3;  // First 3 pages
            ocrPagesToExtract = 2;
            DEBUG.info('PDF-EXTRACT', 'Strategy: 3 pages, OCR 2');
        } else if (totalPages <= 50) {
            textPagesToExtract = 2;  // First 2 pages
            ocrPagesToExtract = 1;
            DEBUG.info('PDF-EXTRACT', 'Strategy: 2 pages, OCR 1');
        } else {
            textPagesToExtract = 1;  // First page only
            ocrPagesToExtract = 1;
            DEBUG.info('PDF-EXTRACT', 'Strategy: 1 page, OCR 1');
        }
        
        if (progressCallback) {
            progressCallback(`📊 Analyse ${textPagesToExtract} page(s) sur ${totalPages}...`, 5);
        }
        
        // Extract metadata
        const metadata = await pdf.getMetadata();
        let metaText = `Document: ${totalPages} pages\n`;
        
        if (metadata.info.Title) metaText += `Titre: ${metadata.info.Title}\n`;
        if (metadata.info.Author) metaText += `Auteur: ${metadata.info.Author}\n`;
        if (metadata.info.Subject) metaText += `Sujet: ${metadata.info.Subject}\n`;
        if (metadata.info.Keywords) metaText += `Mots-clés: ${metadata.info.Keywords}\n`;
        
        metaText += `\n`;
        
        if (progressCallback) {
            progressCallback('Extraction du texte natif...', 10);
        }
        
        // Extract text from sampled pages
        let fullText = metaText;
        DEBUG.startTimer('PDF-EXTRACT-text');
        
        // Minimum text threshold for batch mode (300 chars = ~50 words)
        const minTextThreshold = batchMode ? 300 : 0;
        let actualPagesExtracted = 0;
        
        for (let i = 1; i <= textPagesToExtract; i++) {
            const pageStartTime = performance.now();
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            fullText += `[Page ${i}/${totalPages}]\n${pageText}\n\n`;
            actualPagesExtracted = i;
            
            const pageDuration = performance.now() - pageStartTime;
            DEBUG.debug('PDF-EXTRACT', `Page ${i} text extracted in ${Math.round(pageDuration)}ms (${pageText.length} chars)`);
            
            if (progressCallback) {
                progressCallback(`Extraction page ${i}/${textPagesToExtract}...`, 10 + (i / textPagesToExtract) * 30);
            }
            
            // In batch mode, stop early if we have enough text
            if (batchMode && fullText.length >= minTextThreshold) {
                DEBUG.info('PDF-EXTRACT', `✅ Sufficient text found after ${i} pages (${fullText.length} chars)`);
                break;
            }
        }
        DEBUG.endTimer('PDF-EXTRACT-text');
        DEBUG.info('PDF-EXTRACT', `Total text extracted: ${fullText.length} characters from ${actualPagesExtracted} pages`);

        // Capture first page as image
        DEBUG.startTimer('PDF-EXTRACT-image');
        const firstPage = await pdf.getPage(1);
        // BATCH MODE: Lower resolution for faster processing
        const scale = batchMode ? 1.0 : 2.0;
        const viewport = firstPage.getViewport({ scale });
        DEBUG.debug('PDF-EXTRACT', `Rendering image at scale ${scale} (${viewport.width}x${viewport.height})`);
        
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await firstPage.render({ canvasContext: context, viewport }).promise;
        
        // Convert to base64 (BATCH MODE: lower quality for speed)
        const quality = batchMode ? 0.5 : 0.7;
        const imageBase64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
        DEBUG.endTimer('PDF-EXTRACT-image');
        DEBUG.info('PDF-EXTRACT', `Image size: ${formatBytes(imageBase64.length * 0.75)} (quality: ${quality})`);
        
        // Check if text is empty or too short (likely scanned PDF)
        const textLength = fullText.trim().length;
        const isScanned = textLength < 100; // Less than 100 chars = probably scanned
        DEBUG.info('PDF-EXTRACT', `Text length: ${textLength} chars, isScanned: ${isScanned}`);
        
        // SKIP OCR in batch mode (too slow)
        if (isScanned && !batchMode && ocrPagesToExtract > 0) {
            DEBUG.warn('PDF-EXTRACT', 'Scanned PDF detected, starting OCR...');
            DEBUG.startTimer('PDF-EXTRACT-OCR');
            if (progressCallback) {
                progressCallback('⚠️ PDF scanné détecté, lancement OCR...', 50);
            }
            
            console.log('Text too short (' + textLength + ' chars), running OCR...');
            
            try {
                // Run OCR on sampled pages (intelligent strategy)
                let ocrText = metaText;  // Keep metadata
                
                for (let i = 1; i <= ocrPagesToExtract; i++) {
                    DEBUG.info('PDF-EXTRACT-OCR', `Starting OCR on page ${i}/${ocrPagesToExtract}`);
                    if (progressCallback) {
                        progressCallback(`🔍 OCR page ${i}/${ocrPagesToExtract} (sur ${totalPages} total)...`, 50 + (i / ocrPagesToExtract) * 40);
                    }
                    
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 2.0 });
                    
                    const ocrCanvas = document.createElement('canvas');
                    const ocrContext = ocrCanvas.getContext('2d');
                    ocrCanvas.width = viewport.width;
                    ocrCanvas.height = viewport.height;
                    
                    await page.render({ canvasContext: ocrContext, viewport }).promise;
                    
                    // Run Tesseract OCR
                    const { data: { text } } = await Tesseract.recognize(
                        ocrCanvas,
                        'fra+eng', // French + English
                        {
                            logger: (m) => {
                                if (m.status === 'recognizing text' && progressCallback) {
                                    const progress = 50 + ((i - 1) / ocrPagesToExtract) * 40 + (m.progress * 40 / ocrPagesToExtract);
                                    progressCallback(`🔍 OCR page ${i}/${ocrPagesToExtract} (${Math.round(m.progress * 100)}%)`, progress);
                                }
                            }
                        }
                    );
                    
                    ocrText += `[Page ${i}/${totalPages} - OCR]\n${text}\n\n`;
                }
                
                fullText = ocrText.trim();
                DEBUG.endTimer('PDF-EXTRACT-OCR');
                DEBUG.success('PDF-EXTRACT-OCR', `OCR completed: ${fullText.length} characters extracted`);
                
                if (progressCallback) {
                    progressCallback('✅ OCR terminé !', 95);
                }
                
            } catch (ocrError) {
                DEBUG.error('PDF-EXTRACT-OCR', 'OCR failed', ocrError);
                console.error('OCR Error:', ocrError);
                if (progressCallback) {
                    progressCallback('⚠️ OCR échoué, analyse avec image seule...', 95);
                }
                // Continue with empty text, AI will use image only
            }
        } else {
            if (batchMode && isScanned) {
                DEBUG.warn('PDF-EXTRACT', 'Scanned PDF in batch mode: OCR skipped');
            }
            if (progressCallback) {
                progressCallback('✅ Texte natif extrait !', 95);
            }
        }
        
        if (progressCallback) {
            progressCallback('Finalisation...', 100);
        }
        
        // Limit text to 3000 characters for API efficiency
        const trimmedText = fullText.substring(0, 3000);
        DEBUG.info('PDF-EXTRACT', `Final text length: ${trimmedText.length} chars (trimmed from ${fullText.length})`);
        
        const totalDuration = performance.now() - extractStartTime;
        DEBUG.perf('PDF-EXTRACT', file.name, Math.round(totalDuration));
        DEBUG.success('PDF-EXTRACT', `Extraction completed in ${Math.round(totalDuration)}ms`);
        DEBUG.groupEnd();
        
        return { 
            text: trimmedText, 
            imageBase64,
            isScanned,
            totalPages,
            sampledPages: isScanned && !batchMode ? ocrPagesToExtract : actualPagesExtracted
        };
    } catch (error) {
        const totalDuration = performance.now() - extractStartTime;
        DEBUG.error('PDF-EXTRACT', `Extraction failed after ${Math.round(totalDuration)}ms`, error);
        DEBUG.groupEnd();
        console.error('PDF extraction error:', error);
        throw error;
    }
}

/**
 * Call AI analysis API
 */
async function analyzeWithAI(text, imageBase64, isScanned = false, totalPages = null, sampledPages = null) {
    try {
        const response = await fetch('/api/admin/analyze-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, imageBase64, isScanned, totalPages, sampledPages })
        });
        
        const data = await response.json();
        
        if (!data.success) {
            alert(`Erreur : ${data.error}`);
            return null;
        }
        
        return data.suggestions;
        
    } catch (error) {
        console.error('AI Analysis Error:', error);
        alert('Erreur lors de l\'analyse IA');
        return null;
    }
}

/**
 * Apply AI suggestions to form fields
 */
function applySuggestions(suggestions, context) {
    if (context === 'upload') {
        // Upload form
        const descInput = document.getElementById('pdf-description');
        const folderInput = document.getElementById('pdf-folder');
        
        if (suggestions.description) {
            descInput.value = suggestions.description;
        }
        
        if (suggestions.folder) {
            folderInput.value = suggestions.folder;
        }
        
        if (suggestions.tags && suggestions.tags.length > 0) {
            uploadTags = [...suggestions.tags];
            updateUploadTagsDisplay();
        }
        
        alert('✅ Suggestions appliquées ! Vous pouvez les modifier avant validation.');
        
    } else if (context === 'converter') {
        // Converter form
        const descInput = document.getElementById('converter-description');
        const folderInput = document.getElementById('converter-folder');
        
        if (suggestions.description) {
            descInput.value = suggestions.description;
        }
        
        if (suggestions.folder) {
            folderInput.value = suggestions.folder;
        }
        
        if (suggestions.tags && suggestions.tags.length > 0) {
            converterTags = [...suggestions.tags];
            updateConverterTagsDisplay();
        }
        
        alert('✅ Suggestions appliquées ! Vous pouvez les modifier avant validation.');
        
    } else if (context === 'edit') {
        // Edit modal
        const filenameInput = document.getElementById('modal-filename');
        const descInput = document.getElementById('modal-description');
        const folderInput = document.getElementById('modal-folder');
        
        if (suggestions.filename) {
            filenameInput.value = suggestions.filename;
        }
        
        if (suggestions.description) {
            descInput.value = suggestions.description;
        }
        
        if (suggestions.folder) {
            folderInput.value = suggestions.folder;
        }
        
        if (suggestions.tags && suggestions.tags.length > 0) {
            window.currentModalTags = [...suggestions.tags];
            updateModalTagsDisplay();
        }
        
        alert('✅ Suggestions appliquées ! Cliquez sur "Enregistrer" pour confirmer.');
    }
}

/**
 * Analyze file in upload form
 */
async function analyzeUploadFile() {
    const fileInput = document.getElementById('pdf-file');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Veuillez d\'abord sélectionner un fichier PDF');
        return;
    }
    
    const button = event.target;
    const originalText = button.innerHTML;
    button.disabled = true;
    
    // Progress callback
    const updateProgress = (message, percent) => {
        button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${message}`;
    };
    
    try {
        updateProgress('Analyse en cours...', 0);
        
        const { text, imageBase64, isScanned, totalPages, sampledPages } = await extractPDFContent(file, updateProgress);
        
        if (isScanned && text.length < 50) {
            alert('⚠️ OCR n\'a pas pu extraire assez de texte. L\'IA utilisera uniquement l\'image.');
        }
        
        updateProgress('Envoi à l\'IA...', 95);
        const suggestions = await analyzeWithAI(text, imageBase64, isScanned, totalPages, sampledPages);
        
        if (suggestions) {
            applySuggestions(suggestions, 'upload');
        }
    } catch (error) {
        console.error('Analysis error:', error);
        alert('❌ Erreur lors de l\'analyse du PDF');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

/**
 * Analyze converted file in converter
 */
async function analyzeConvertedFile() {
    if (!convertedPDFBlob) {
        alert('Veuillez d\'abord convertir le PDF');
        return;
    }
    
    const button = event.target;
    const originalText = button.innerHTML;
    button.disabled = true;
    
    // Progress callback
    const updateProgress = (message, percent) => {
        button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${message}`;
    };
    
    try {
        updateProgress('Analyse en cours...', 0);
        
        const file = new File([convertedPDFBlob], 'converted.pdf', { type: 'application/pdf' });
        
        const { text, imageBase64, isScanned, totalPages, sampledPages } = await extractPDFContent(file, updateProgress);
        
        if (isScanned && text.length < 50) {
            alert('⚠️ OCR n\'a pas pu extraire assez de texte. L\'IA utilisera uniquement l\'image.');
        }
        
        updateProgress('Envoi à l\'IA...', 95);
        const suggestions = await analyzeWithAI(text, imageBase64, isScanned, totalPages, sampledPages);
        
        if (suggestions) {
            applySuggestions(suggestions, 'converter');
        }
    } catch (error) {
        console.error('Analysis error:', error);
        alert('❌ Erreur lors de l\'analyse du PDF');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

/**
 * Re-analyze document in edit modal
 */
async function reanalyzeDocument(token) {
    const doc = allDocuments.find(d => d.token === token);
    
    if (!confirm(`⚠️ Cette analyse consommera des crédits API.\n\nAnalyser "${doc.filename}" ?`)) {
        return;
    }
    
    const button = event.target;
    const originalText = button.innerHTML;
    button.disabled = true;
    
    // Progress callback
    const updateProgress = (message, percent) => {
        button.innerHTML = `<i class="fas fa-spinner fa-spin mr-2"></i>${message}`;
    };
    
    try {
        updateProgress('Téléchargement...', 0);
        
        // Download PDF from server
        const pdfResponse = await fetch(`/api/documents/${token}`);
        const pdfBlob = await pdfResponse.blob();
        
        // Create file from blob
        const file = new File([pdfBlob], doc.filename, { type: 'application/pdf' });
        
        updateProgress('Analyse en cours...', 10);
        
        // Extract and analyze
        const { text, imageBase64, isScanned, totalPages, sampledPages } = await extractPDFContent(file, updateProgress);
        
        if (isScanned && text.length < 50) {
            alert('⚠️ OCR n\'a pas pu extraire assez de texte. L\'IA utilisera uniquement l\'image.');
        }
        
        updateProgress('Envoi à l\'IA...', 95);
        const suggestions = await analyzeWithAI(text, imageBase64, isScanned, totalPages, sampledPages);
        
        if (suggestions) {
            applySuggestions(suggestions, 'edit');
        }
    } catch (error) {
        console.error('Analysis error:', error);
        alert('❌ Erreur lors de l\'analyse du document');
    } finally {
        button.disabled = false;
        button.innerHTML = originalText;
    }
}

// ==========================================
// BATCH ANALYZE FUNCTIONS
// ==========================================

function openBatchAnalyze() {
    const modal = document.createElement('div');
    modal.id = 'batch-analyze-modal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div class="p-6">
                <div class="flex justify-between items-center mb-6">
                    <h2 class="text-2xl font-bold text-white flex items-center gap-2">
                        <i class="fas fa-magic text-purple-400"></i>
                        Analyse IA par Lot
                    </h2>
                    <button onclick="closeBatchAnalyze()" class="text-gray-400 hover:text-white text-2xl">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
                
                <div class="mb-6 space-y-4">
                    <div class="bg-blue-900 border border-blue-700 rounded-lg p-4">
                        <p class="text-white text-sm">
                            <i class="fas fa-info-circle mr-2"></i>
                            Sélectionnez les documents à analyser avec l'IA. L'analyse mettra à jour automatiquement
                            les descriptions, tags et dossiers suggérés.
                        </p>
                        <p class="text-gray-300 text-xs mt-2">
                            ⚠️ Limite : 15 requêtes/minute (Gemini Flash). Un délai de 4 secondes est appliqué entre chaque analyse.
                        </p>
                        <p class="text-yellow-300 text-xs mt-2">
                            ⚡ Mode batch optimisé : Extraction rapide (1ère page uniquement, pas d'OCR). Recommandé : 5 documents max par lot.
                        </p>
                    </div>
                    
                    <div class="bg-gray-700 rounded-lg p-4">
                        <div class="flex items-center justify-between mb-3">
                            <label class="flex items-center gap-2 text-white cursor-pointer">
                                <input type="checkbox" id="select-all-batch" onchange="toggleSelectAllBatch()" class="w-4 h-4">
                                <span class="font-medium">Tout sélectionner</span>
                            </label>
                            <span id="batch-count" class="text-sm text-gray-300">0 sélectionné(s)</span>
                        </div>
                        <div id="batch-documents-list" class="space-y-2 max-h-96 overflow-y-auto">
                            <!-- Documents will be listed here -->
                        </div>
                    </div>
                    
                    <div id="batch-progress" class="hidden bg-gray-700 rounded-lg p-4">
                        <div class="space-y-2">
                            <div class="flex justify-between text-sm text-white">
                                <span id="batch-status">En cours...</span>
                                <span id="batch-progress-text">0 / 0</span>
                            </div>
                            <div class="w-full bg-gray-600 rounded-full h-2">
                                <div id="batch-progress-bar" class="bg-purple-600 h-2 rounded-full transition-all" style="width: 0%"></div>
                            </div>
                        </div>
                        <div id="batch-details" class="mt-3 space-y-1 max-h-60 overflow-y-auto"></div>
                    </div>
                    
                    <div class="flex gap-3">
                        <button 
                            onclick="startBatchAnalyze()"
                            id="batch-analyze-btn"
                            class="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition font-medium"
                        >
                            <i class="fas fa-play mr-2"></i>
                            Lancer l'analyse
                        </button>
                        <button 
                            onclick="closeBatchAnalyze()"
                            class="bg-gray-600 hover:bg-gray-500 text-white px-6 py-3 rounded-lg transition"
                        >
                            Annuler
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    loadBatchDocuments();
}

function closeBatchAnalyze() {
    const modal = document.getElementById('batch-analyze-modal');
    if (modal) modal.remove();
}

async function loadBatchDocuments() {
    const listDiv = document.getElementById('batch-documents-list');
    listDiv.innerHTML = '<div class="text-center py-4"><div class="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div></div>';
    
    try {
        const response = await fetch('/api/admin/documents');
        const data = await response.json();
        
        if (data.success && data.documents.length > 0) {
            listDiv.innerHTML = data.documents.map(doc => {
                // Parse tags if string, or use as array if already parsed
                const tagsArray = typeof doc.tags === 'string' ? (doc.tags ? JSON.parse(doc.tags) : []) : (doc.tags || []);
                
                return `
                <label class="flex items-center gap-3 p-3 bg-gray-800 rounded hover:bg-gray-750 cursor-pointer">
                    <input type="checkbox" class="batch-doc-checkbox w-4 h-4" value="${doc.token}" data-filename="${doc.filename}">
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-medium truncate">${doc.filename}</p>
                        <p class="text-xs text-gray-400 truncate">${doc.description || 'Pas de description'}</p>
                    </div>
                    <div class="flex flex-wrap gap-1">
                        ${tagsArray.slice(0, 2).map(tag => `
                            <span class="px-2 py-1 bg-blue-600 text-white text-xs rounded">${tag}</span>
                        `).join('')}
                        ${tagsArray.length > 2 ? `<span class="text-xs text-gray-400">+${tagsArray.length - 2}</span>` : ''}
                    </div>
                </label>
                `;
            }).join('');
            
            // Add change listeners
            document.querySelectorAll('.batch-doc-checkbox').forEach(cb => {
                cb.addEventListener('change', updateBatchCount);
            });
        } else {
            listDiv.innerHTML = '<p class="text-center text-gray-400 py-4">Aucun document disponible</p>';
        }
    } catch (error) {
        console.error('Error loading documents:', error);
        listDiv.innerHTML = '<p class="text-center text-red-400 py-4">Erreur lors du chargement</p>';
    }
}

function toggleSelectAllBatch() {
    const selectAll = document.getElementById('select-all-batch');
    const checkboxes = document.querySelectorAll('.batch-doc-checkbox');
    checkboxes.forEach(cb => cb.checked = selectAll.checked);
    updateBatchCount();
}

function updateBatchCount() {
    const checkboxes = document.querySelectorAll('.batch-doc-checkbox:checked');
    document.getElementById('batch-count').textContent = `${checkboxes.length} sélectionné(s)`;
}

// ==========================================
// PAGE SPLIT OPTIONS TOGGLE FUNCTIONS
// ==========================================

function toggleSplitOptions() {
    const isDouble = document.querySelector('input[name="page-format"]:checked')?.value === 'double';
    const subOptions = document.getElementById('split-suboptions');
    if (subOptions) {
        if (isDouble) {
            subOptions.classList.remove('hidden');
        } else {
            subOptions.classList.add('hidden');
        }
    }
}

function toggleUploadSplitOptions() {
    const isDouble = document.querySelector('input[name="upload-page-format"]:checked')?.value === 'double';
    const subOptions = document.getElementById('upload-split-suboptions');
    if (subOptions) {
        if (isDouble) {
            subOptions.classList.remove('hidden');
        } else {
            subOptions.classList.add('hidden');
        }
    }
}

async function startBatchAnalyze() {
    DEBUG.group('🤖 BATCH ANALYZE');
    const batchStartTime = performance.now();
    
    const checkboxes = Array.from(document.querySelectorAll('.batch-doc-checkbox:checked'));
    DEBUG.info('BATCH-ANALYZE', `Documents selected: ${checkboxes.length}`);
    
    if (checkboxes.length === 0) {
        DEBUG.warn('BATCH-ANALYZE', 'No documents selected');
        DEBUG.groupEnd();
        alert('Veuillez sélectionner au moins un document');
        return;
    }
    
    const button = document.getElementById('batch-analyze-btn');
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Analyse en cours...';
    
    const progressDiv = document.getElementById('batch-progress');
    const detailsDiv = document.getElementById('batch-details');
    progressDiv.classList.remove('hidden');
    detailsDiv.innerHTML = '';
    
    try {
        // Prepare documents for batch analysis
        const documentsToAnalyze = [];
        DEBUG.startTimer('BATCH-ANALYZE-extraction-phase');
        
        for (let i = 0; i < checkboxes.length; i++) {
            const cb = checkboxes[i];
            const token = cb.value;
            const filename = cb.dataset.filename;
            
            DEBUG.info('BATCH-ANALYZE', `[${i+1}/${checkboxes.length}] Processing: ${filename}`);
            
            document.getElementById('batch-status').textContent = `Extraction du contenu ${i + 1}/${checkboxes.length}...`;
            document.getElementById('batch-progress-text').textContent = `${i} / ${checkboxes.length}`;
            document.getElementById('batch-progress-bar').style.width = `${(i / checkboxes.length) * 100}%`;
            
            // Fetch PDF from R2
            document.getElementById('batch-status').textContent = `📥 Téléchargement ${filename}...`;
            DEBUG.startTimer(`BATCH-download-${i}`);
            const downloadStartTime = performance.now();
            const pdfResponse = await fetch(`/api/documents/${token}`);
            const pdfBlob = await pdfResponse.blob();
            const pdfFile = new File([pdfBlob], filename, { type: 'application/pdf' });
            DEBUG.endTimer(`BATCH-download-${i}`);
            const downloadDuration = performance.now() - downloadStartTime;
            DEBUG.perf('BATCH-ANALYZE', `Download ${filename}`, Math.round(downloadDuration));
            
            // Extract content with progress callback
            const progressCallback = (message, percent) => {
                document.getElementById('batch-status').textContent = `[${i + 1}/${checkboxes.length}] ${message}`;
                DEBUG.debug('BATCH-ANALYZE', `[${i+1}/${checkboxes.length}] ${message} (${percent}%)`);
            };
            
            document.getElementById('batch-status').textContent = `[${i + 1}/${checkboxes.length}] 🔍 Extraction rapide (1 page)...`;
            const extractionStartTime = performance.now();
            const { text, imageBase64, isScanned, totalPages, sampledPages } = await extractPDFContent(pdfFile, progressCallback, true); // true = batch mode (fast)
            const extractionDuration = performance.now() - extractionStartTime;
            DEBUG.perf('BATCH-ANALYZE', `Extract ${filename}`, Math.round(extractionDuration));
            
            documentsToAnalyze.push({
                documentId: token,
                filename,
                text,
                imageBase64,
                isScanned,
                totalPages,
                sampledPages
            });
            
            detailsDiv.innerHTML += `<div class="text-sm text-gray-300"><i class="fas fa-check text-green-400 mr-2"></i>Extrait: ${filename}</div>`;
        }
        
        // Send to batch analyze endpoint
        DEBUG.endTimer('BATCH-ANALYZE-extraction-phase');
        const extractionPhaseDuration = performance.now() - batchStartTime;
        DEBUG.perf('BATCH-ANALYZE', 'Extraction phase', Math.round(extractionPhaseDuration));
        
        document.getElementById('batch-status').textContent = 'Envoi à l\'IA...';
        DEBUG.info('BATCH-ANALYZE', 'Sending to AI API', { 
            documentsCount: documentsToAnalyze.length,
            totalTextLength: documentsToAnalyze.reduce((sum, doc) => sum + doc.text.length, 0)
        });
        
        // Estimate AI processing time: ~8-10 seconds per document
        const estimatedAIDuration = documentsToAnalyze.length * 10000; // 10s per doc
        
        // Start simulated progress bar (40% to 95% over estimated duration)
        let currentProgress = 40;
        let statusMessageIndex = 0;
        const statusMessages = [
            '🤖 Analyse IA en cours...',
            '📊 Analyse du contenu...',
            '🏷️ Génération des tags...',
            '📁 Suggestion de dossier...',
            '✍️ Rédaction description...',
            '🔍 Finalisation analyse...'
        ];
        
        const progressInterval = setInterval(() => {
            currentProgress += 1;
            if (currentProgress <= 95) {
                document.getElementById('batch-progress-bar').style.width = `${currentProgress}%`;
                document.getElementById('batch-progress-text').textContent = `${currentProgress}%`;
                
                // Update status message every ~15% progress
                if (currentProgress % 10 === 0 && statusMessageIndex < statusMessages.length - 1) {
                    statusMessageIndex++;
                    document.getElementById('batch-status').textContent = statusMessages[statusMessageIndex];
                }
            }
        }, estimatedAIDuration / 55); // Spread 55% progress over estimated time
        
        DEBUG.startTimer('BATCH-ANALYZE-ai-phase');
        const aiStartTime = performance.now();
        const response = await fetch('/api/admin/batch-analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ documents: documentsToAnalyze })
        });
        
        const result = await response.json();
        
        // Stop simulated progress
        clearInterval(progressInterval);
        
        DEBUG.endTimer('BATCH-ANALYZE-ai-phase');
        const aiDuration = performance.now() - aiStartTime;
        DEBUG.perf('BATCH-ANALYZE', 'AI analysis phase', Math.round(aiDuration));
        DEBUG.info('BATCH-ANALYZE', 'AI response', result);
        
        if (result.success) {
            DEBUG.success('BATCH-ANALYZE', `Analysis completed: ${result.analyzed} success, ${result.failed} failed`);
            
            // Update progress
            document.getElementById('batch-status').textContent = 'Terminé !';
            document.getElementById('batch-progress-text').textContent = `${result.analyzed} / ${result.total}`;
            document.getElementById('batch-progress-bar').style.width = '100%';
            
            // Show results with apply buttons
            detailsDiv.innerHTML = `
                <div class="mt-4 pt-4 border-t border-gray-600">
                    <p class="text-white font-semibold mb-3">
                        <i class="fas fa-check-circle text-green-400 mr-2"></i>
                        Analyse terminée ! ${result.analyzed} succès, ${result.failed} échecs
                    </p>
                </div>
            `;
            
            result.results.forEach((res, index) => {
                DEBUG.debug('BATCH-ANALYZE', `Success: ${res.filename}`, res.suggestions);
                
                const resultId = `batch-result-${index}`;
                
                detailsDiv.innerHTML += `
                    <div class="bg-gray-800 rounded-lg p-4 mb-3" id="${resultId}" data-suggestions='${JSON.stringify(res).replace(/'/g, "&#39;")}'>
                        <div class="flex items-start justify-between gap-3 mb-2">
                            <div class="flex-1">
                                <p class="text-white font-medium">${res.filename}</p>
                                <p class="text-sm text-gray-400 mt-1">${res.description?.substring(0, 100)}...</p>
                            </div>
                            <button 
                                onclick="applyBatchSuggestions('${resultId}')"
                                class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm whitespace-nowrap transition"
                            >
                                <i class="fas fa-magic mr-2"></i>Appliquer
                            </button>
                        </div>
                        <div class="flex flex-wrap gap-2 mt-2">
                            ${res.tags?.slice(0, 3).map(tag => 
                                `<span class="px-2 py-1 bg-blue-900 text-blue-200 text-xs rounded">${tag}</span>`
                            ).join('') || ''}
                        </div>
                    </div>
                `;
            });
            
            result.errors.forEach(err => {
                DEBUG.error('BATCH-ANALYZE', `Failed: ${err.filename}`, err.error);
                detailsDiv.innerHTML += `
                    <div class="bg-red-900/20 border border-red-700 rounded-lg p-3 mb-2">
                        <p class="text-sm text-red-400">
                            <i class="fas fa-times-circle mr-2"></i>
                            <strong>${err.filename}</strong>: ${err.error}
                        </p>
                    </div>
                `;
            });
            
            // Reload documents list
            await loadDocuments();
            
            const totalDuration = performance.now() - batchStartTime;
            DEBUG.perf('BATCH-ANALYZE', 'Total batch process', Math.round(totalDuration));
            DEBUG.success('BATCH-ANALYZE', `Batch analysis completed in ${Math.round(totalDuration)}ms`);
            DEBUG.groupEnd();
            
            // Change button to "Fermer" instead of auto-closing
            button.innerHTML = '<i class="fas fa-check mr-2"></i>Fermer';
            button.onclick = closeBatchAnalyze;
        } else {
            DEBUG.error('BATCH-ANALYZE', 'Batch analysis failed', result.error);
            DEBUG.groupEnd();
            alert('Erreur: ' + result.error);
            
            // Reset button on full failure
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play mr-2"></i>Lancer l\'analyse';
        }
    } catch (error) {
        const totalDuration = performance.now() - batchStartTime;
        DEBUG.error('BATCH-ANALYZE', `Batch analyze error after ${Math.round(totalDuration)}ms`, error);
        DEBUG.groupEnd();
        console.error('Batch analyze error:', error);
        alert('❌ Erreur lors de l\'analyse par lot');
        
        // Reset button on exception
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-play mr-2"></i>Lancer l\'analyse';
    }
}

/**
 * Apply AI suggestions from batch analyze to a specific document
 */
async function applyBatchSuggestions(resultId) {
    DEBUG.group(`🔧 APPLY SUGGESTIONS: ${resultId}`);
    
    try {
        // Get suggestions from data attribute
        const resultDiv = document.getElementById(resultId);
        const suggestions = JSON.parse(resultDiv.dataset.suggestions);
        
        DEBUG.info('APPLY-SUGGESTIONS', 'Applying', suggestions);
        
        const response = await fetch(`/api/admin/documents/${suggestions.documentId}/description`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                filename: suggestions.filename,
                description: suggestions.description,
                tags: suggestions.tags,
                folder: suggestions.folder
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            DEBUG.success('APPLY-SUGGESTIONS', 'Suggestions applied successfully');
            
            // Visual feedback - mark button as applied
            const button = resultDiv.querySelector('button');
            button.classList.remove('bg-blue-600', 'hover:bg-blue-700');
            button.classList.add('bg-green-600', 'cursor-not-allowed');
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-check mr-2"></i>Appliqué';
            
            // Reload documents to show updated metadata
            await loadDocuments();
            
            DEBUG.groupEnd();
        } else {
            DEBUG.error('APPLY-SUGGESTIONS', 'Failed to apply', result.error);
            DEBUG.groupEnd();
            alert('❌ Erreur lors de l\'application des suggestions');
        }
    } catch (error) {
        DEBUG.error('APPLY-SUGGESTIONS', 'Error', error);
        DEBUG.groupEnd();
        console.error('Apply suggestions error:', error);
        alert('❌ Erreur lors de l\'application des suggestions');
    }
}
