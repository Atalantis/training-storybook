// ==========================================
// PDF READER WITH STPAGEFLIP INTEGRATION
// ==========================================

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// ==========================================
// STATE MANAGEMENT
// ==========================================

let pdfDoc = null;
let pageFlip = null;
let currentPdfUrl = '';
let currentPdfFilename = '';
let pdfHistory = [];
let deleteItemId = null;

// ==========================================
// DOM ELEMENTS
// ==========================================

const uploadScreen = document.getElementById('upload-screen');
const viewer = document.getElementById('viewer');
const flipbookContainer = document.getElementById('flipbook');
const loading = document.getElementById('loading');
const progressBar = document.getElementById('progress-bar');
const progressText = document.getElementById('progress-text');

const fileInput = document.getElementById('file-input');
const selectBtn = document.getElementById('select-btn');
const uploadCard = document.getElementById('upload-card');
const urlInput = document.getElementById('url-input');
const urlBtn = document.getElementById('url-btn');

const closeBtn = document.getElementById('close-btn');
const pageInfo = document.getElementById('page-info');
const thumbnailsBtn = document.getElementById('thumbnails-btn');

const thumbnailPanel = document.getElementById('thumbnail-panel');
const thumbnailGrid = document.getElementById('thumbnail-grid');

const historySection = document.getElementById('history-section');
const historyGrid = document.getElementById('history-grid');
const historyClearBtn = document.getElementById('history-clear-btn');
const deleteModal = document.getElementById('delete-modal');
const deleteModalText = document.getElementById('delete-modal-text');
const deleteModalCancel = document.getElementById('delete-modal-cancel');
const deleteModalConfirm = document.getElementById('delete-modal-confirm');

// Pre-fill URL if user provided one
const defaultPdfUrl = 'https://page.gensparksite.com/get_upload_url/21441d2c5496065b8787b67c98bb53cdde8189e10893c684da0eb4363edbedd6/default/c630b51f-b9d2-40ba-bd8f-bfaabf1b3977';
if (urlInput) urlInput.value = defaultPdfUrl;

// ==========================================
// UPLOAD & LOADING EVENTS
// ==========================================

if (selectBtn) {
    selectBtn.addEventListener('click', () => fileInput.click());
}

if (uploadCard) {
    uploadCard.addEventListener('click', (e) => {
        if (e.target !== urlInput && e.target !== urlBtn) {
            fileInput.click();
        }
    });
}

if (fileInput) {
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            currentPdfFilename = file.name;
            currentPdfUrl = 'local://' + file.name;
            const arrayBuffer = await file.arrayBuffer();
            await loadPDF(arrayBuffer);
        }
    });
}

if (urlBtn) {
    urlBtn.addEventListener('click', async () => {
        const url = urlInput.value.trim();
        if (url) {
            currentPdfUrl = url;
            currentPdfFilename = url.split('/').pop().split('?')[0] || 'Document PDF';
            showLoading(true, 'Chargement du PDF...');
            try {
                const response = await fetch(url);
                if (!response.ok) throw new Error('Failed to fetch PDF');
                const arrayBuffer = await response.arrayBuffer();
                await loadPDF(arrayBuffer);
            } catch (error) {
                alert('Erreur lors du chargement du PDF. Vérifiez l\'URL.');
                console.error(error);
                showLoading(false);
            }
        }
    });
}

if (closeBtn) {
    closeBtn.addEventListener('click', closeViewer);
}

if (thumbnailsBtn) {
    thumbnailsBtn.addEventListener('click', toggleThumbnails);
}

// ==========================================
// KEYBOARD NAVIGATION
// ==========================================

document.addEventListener('keydown', (e) => {
    // Don't handle if typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
    }
    
    // Only handle navigation when viewer is active
    if (!viewerContainer || !viewerContainer.classList.contains('active') || !pageFlip) {
        return;
    }
    
    switch(e.key) {
        case 'ArrowLeft':
        case 'PageUp':
            e.preventDefault();
            pageFlip.flipPrev();
            updatePageInfo();
            break;
            
        case 'ArrowRight':
        case 'PageDown':
        case ' ':
            e.preventDefault();
            pageFlip.flipNext();
            updatePageInfo();
            break;
            
        case 'Home':
            e.preventDefault();
            pageFlip.turnToPage(0);
            updatePageInfo();
            break;
            
        case 'End':
            e.preventDefault();
            if (pdfDoc) {
                pageFlip.turnToPage(pdfDoc.numPages - 1);
                updatePageInfo();
            }
            break;
            
        case 't':
        case 'T':
            e.preventDefault();
            toggleThumbnails();
            break;
            
        case 'Escape':
            e.preventDefault();
            if (thumbnailPanel && thumbnailPanel.style.display === 'block') {
                toggleThumbnails();
            } else {
                closeViewer();
            }
            break;
    }
});

// ==========================================
// DRAG & DROP SUPPORT
// ==========================================

let dragCounter = 0;

if (uploadCard) {
    uploadCard.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter++;
        uploadCard.classList.add('drag-over');
    });

    uploadCard.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter--;
        if (dragCounter === 0) {
            uploadCard.classList.remove('drag-over');
        }
    });

    uploadCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    uploadCard.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragCounter = 0;
        uploadCard.classList.remove('drag-over');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                currentPdfFilename = file.name;
                currentPdfUrl = 'local://' + file.name;
                const arrayBuffer = await file.arrayBuffer();
                await loadPDF(arrayBuffer);
            } else {
                alert('Veuillez glisser un fichier PDF');
            }
        }
    });
}

if (uploadScreen) {
    uploadScreen.addEventListener('dragenter', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    uploadScreen.addEventListener('dragleave', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    uploadScreen.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.stopPropagation();
    });

    uploadScreen.addEventListener('drop', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            if (file.type === 'application/pdf') {
                currentPdfFilename = file.name;
                currentPdfUrl = 'local://' + file.name;
                const arrayBuffer = await file.arrayBuffer();
                await loadPDF(arrayBuffer);
            } else {
                alert('Veuillez glisser un fichier PDF');
            }
        }
    });
}

// ==========================================
// PDF LOADING LOGIC
// ==========================================

async function loadPDF(data) {
    try {
        showLoading(true, 'Chargement du PDF...');
        updateProgress(0, 'Initialisation...');
        
        pdfDoc = await pdfjsLib.getDocument(data).promise;
        
        console.log(`PDF chargé: ${pdfDoc.numPages} pages`);
        
        updateProgress(30, 'Préparation des pages...');
        
        // Show viewer
        if (uploadScreen) uploadScreen.style.display = 'none';
        if (viewer) viewer.classList.add('active');
        
        updateProgress(60, 'Initialisation du flipbook...');
        
        // Initialize StPageFlip
        await initializePageFlip();
        
        updateProgress(80, 'Génération des miniatures...');
        await generateThumbnails();
        
        updateProgress(100, 'Terminé !');
        
        setTimeout(() => {
            showLoading(false);
        }, 500);
        
        // Save to history
        if (currentPdfUrl && pdfDoc) {
            await savePdfToHistory(currentPdfFilename, currentPdfUrl, pdfDoc.numPages);
        }
    } catch (error) {
        console.error('Error loading PDF:', error);
        alert('Erreur lors du chargement du PDF');
        showLoading(false);
    }
}

// Load PDF from bytes (for converted PDFs from pdf-converter.js)
async function loadPDFFromBytes(pdfBytes, filename) {
    currentPdfFilename = filename;
    currentPdfUrl = 'converted://' + filename;
    await loadPDF(pdfBytes);
}

// ==========================================
// STPAGEFLIP INITIALIZATION
// ==========================================

async function initializePageFlip() {
    if (!pdfDoc || !flipbookContainer) return;
    
    // Destroy previous instance if exists
    if (pageFlip) {
        pageFlip.destroy();
        pageFlip = null;
    }
    
    // Clear container
    flipbookContainer.innerHTML = '';
    
    // Render all pages as HTML divs with canvas inside
    const scale = 1.5; // Optimized scale for quality/performance balance
    
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale });
        
        // Create page div
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        
        // Mark pages as hard for better flip effect (HTML mode)
        if (pageNum === 1 || pageNum === pdfDoc.numPages) {
            pageDiv.dataset.density = 'hard'; // Cover pages are hard
        } else {
            pageDiv.dataset.density = 'soft'; // Inner pages are soft
        }
        
        // Create canvas for this page
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        
        const context = canvas.getContext('2d');
        
        // White background
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render PDF page
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        pageDiv.appendChild(canvas);
        flipbookContainer.appendChild(pageDiv);
    }
    
    // Get first page to determine aspect ratio
    const firstPage = await pdfDoc.getPage(1);
    const firstViewport = firstPage.getViewport({ scale: 1.0 });
    const pageAspectRatio = firstViewport.width / firstViewport.height;
    
    // Get container dimensions
    const containerWidth = flipbookContainer.parentElement.offsetWidth;
    const containerHeight = flipbookContainer.parentElement.offsetHeight;
    
    // Calculate optimal page size respecting aspect ratio
    // For double-page view, each page takes roughly half the container width
    let pageWidth, pageHeight;
    
    // Try fitting by height first
    pageHeight = containerHeight - 40;
    pageWidth = Math.floor(pageHeight * pageAspectRatio);
    
    // If too wide for double-page view, fit by width
    if (pageWidth * 2 > containerWidth * 0.9) {
        pageWidth = Math.floor((containerWidth * 0.9) / 2);
        pageHeight = Math.floor(pageWidth / pageAspectRatio);
    }
    
    console.log(`📏 Page dimensions: ${pageWidth}x${pageHeight} (aspect ratio: ${pageAspectRatio.toFixed(2)})`);
    console.log(`📖 Mode: Double page (2 pages visible)`);
    
    // Initialize PageFlip with full interactive mode - LANDSCAPE for double-page view
    try {
        pageFlip = new St.PageFlip(flipbookContainer, {
            width: pageWidth,
            height: pageHeight,
            
            size: 'fixed',              // Fixed size to preserve aspect ratio
            minWidth: 315,
            maxWidth: 1000,
            minHeight: 400,
            maxHeight: 1533,
            
            // Shadows and visual effects
            drawShadow: true,
            maxShadowOpacity: 1,        // Max shadow for better fold visibility
            
            // Interaction settings
            flippingTime: 800,          // Slightly faster for better feel
            usePortrait: false,         // ✅ FALSE = landscape mode = double-page view
            startZIndex: 0,
            autoSize: false,            // Disable autoSize to prevent deformation
            showCover: true,            // First page shown alone, then pairs
            mobileScrollSupport: true,
            
            // Enable full interactive features
            clickEventForward: true,
            useMouseEvents: true,       // CRITICAL: enables drag/fold interaction
            swipeDistance: 30,
            showPageCorners: true,      // Show interactive corners
            disableFlipByClick: false   // Allow both corner drag AND full-page click
        });
        
        // Load pages into PageFlip
        pageFlip.loadFromHTML(document.querySelectorAll('.page'));
        
        // Event listeners
        pageFlip.on('flip', (e) => {
            console.log('📖 Page flipped to:', e.data);
            updatePageInfo();
        });
        
        pageFlip.on('changeOrientation', (e) => {
            console.log('🔄 Orientation changed:', e.data);
        });
        
        pageFlip.on('changeState', (e) => {
            console.log('🎬 State changed:', e.data); // read, user_fold, fold_corner, flipping
            if (e.data === 'user_fold' || e.data === 'fold_corner') {
                console.log('👆 User is interacting with page corner/fold');
            }
        });
        
        // Update page info
        updatePageInfo();
        
        console.log('✅ PageFlip initialized successfully');
        
    } catch (error) {
        console.error('❌ Error initializing PageFlip:', error);
        alert('Erreur lors de l\'initialisation du flipbook');
    }
}

// ==========================================
// PAGE INFO UPDATE
// ==========================================

function updatePageInfo() {
    if (!pageFlip || !pageInfo || !pdfDoc) return;
    
    const currentPageIndex = pageFlip.getCurrentPageIndex();
    const totalPages = pdfDoc.numPages;
    
    pageInfo.textContent = `Page ${currentPageIndex + 1} / ${totalPages}`;
}

// ==========================================
// VIEWER CONTROLS
// ==========================================

function closeViewer() {
    if (viewer) {
        viewer.classList.remove('active');
    }
    if (uploadScreen) {
        uploadScreen.style.display = 'flex';
    }
    
    // Destroy PageFlip
    if (pageFlip) {
        pageFlip.destroy();
        pageFlip = null;
    }
    
    pdfDoc = null;
}

// ==========================================
// LOADING & PROGRESS
// ==========================================

function showLoading(show, message = 'Chargement...') {
    if (loading) {
        loading.style.display = show ? 'flex' : 'none';
    }
    if (show && progressText) {
        progressText.textContent = message;
    }
}

function updateProgress(percent, message = '') {
    if (progressBar) {
        progressBar.style.width = percent + '%';
    }
    if (progressText && message) {
        progressText.textContent = message;
    }
}

// ==========================================
// THUMBNAILS MANAGEMENT
// ==========================================

function toggleThumbnails() {
    if (!thumbnailPanel) return;
    const isVisible = thumbnailPanel.style.display === 'block';
    thumbnailPanel.style.display = isVisible ? 'none' : 'block';
}

async function generateThumbnails() {
    if (!pdfDoc || !thumbnailGrid) return;
    
    thumbnailGrid.innerHTML = '';
    const thumbScale = 0.3;
    
    // Book layout mode - pages displayed as in a real book
    thumbnailGrid.classList.add('book-mode');
    
    const totalPages = pdfDoc.numPages;
    
    // Page 1 (front cover) - alone on first row
    const page1Container = document.createElement('div');
    page1Container.className = 'thumbnail-row';
    const thumb1 = await createThumbnail(1, thumbScale);
    page1Container.appendChild(thumb1);
    thumbnailGrid.appendChild(page1Container);
    
    // Pages 2 to N - in pairs (double pages)
    // We process pages 2 to totalPages
    let pageNum = 2;
    
    while (pageNum <= totalPages) {
        const rowContainer = document.createElement('div');
        rowContainer.className = 'thumbnail-row';
        
        // Check if this is the last page and it's alone (odd total pages means last page alone)
        const isLastPageAlone = (pageNum === totalPages && totalPages % 2 === 0);
        
        if (isLastPageAlone) {
            // Last page (back cover) alone
            const thumbLast = await createThumbnail(pageNum, thumbScale);
            rowContainer.appendChild(thumbLast);
            thumbnailGrid.appendChild(rowContainer);
            break;
        } else {
            // Normal double page spread
            const thumbLeft = await createThumbnail(pageNum, thumbScale);
            rowContainer.appendChild(thumbLeft);
            
            if (pageNum + 1 <= totalPages) {
                const thumbRight = await createThumbnail(pageNum + 1, thumbScale);
                rowContainer.appendChild(thumbRight);
            }
            
            thumbnailGrid.appendChild(rowContainer);
            pageNum += 2;
        }
    }
}

async function createThumbnail(pageNum, thumbScale) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: thumbScale });
    
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = viewport.width;
    thumbCanvas.height = viewport.height;
    const thumbCtx = thumbCanvas.getContext('2d');
    
    // White background
    thumbCtx.fillStyle = 'white';
    thumbCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
    
    await page.render({
        canvasContext: thumbCtx,
        viewport: viewport
    }).promise;
    
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'thumbnail-item';
    
    // Highlight if current page (get current page from pageFlip)
    if (pageFlip) {
        const currentPageIndex = pageFlip.getCurrentPageIndex();
        if (pageNum === currentPageIndex + 1) {
            thumbContainer.classList.add('active');
        }
    }
    
    const thumbLabel = document.createElement('div');
    thumbLabel.className = 'thumbnail-label';
    thumbLabel.textContent = `Page ${pageNum}`;
    
    thumbContainer.appendChild(thumbCanvas);
    thumbContainer.appendChild(thumbLabel);
    
    thumbContainer.addEventListener('click', () => {
        if (pageFlip) {
            pageFlip.turnToPage(pageNum - 1); // PageFlip uses 0-based index
            updatePageInfo();
            toggleThumbnails();
            
            // Regenerate thumbnails to update active state
            generateThumbnails();
        }
    });
    
    return thumbContainer;
}

// ==========================================
// PDF HISTORY MANAGEMENT
// ==========================================

async function loadHistory() {
    try {
        const response = await fetch('/api/history');
        const data = await response.json();
        
        if (data.success && data.data) {
            pdfHistory = data.data;
            renderHistory();
        }
    } catch (error) {
        console.error('Error loading history:', error);
        loadHistoryFromLocalStorage();
    }
}

function loadHistoryFromLocalStorage() {
    const stored = localStorage.getItem('pdfHistory');
    if (stored) {
        pdfHistory = JSON.parse(stored);
        renderHistory();
    }
}

async function savePdfToHistory(filename, url, totalPages) {
    try {
        const historyItem = {
            filename,
            url,
            file_size: 0,
            mime_type: 'application/pdf',
            total_pages: totalPages,
            last_page: 1
        };
        
        const response = await fetch('/api/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(historyItem)
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadHistory();
        }
    } catch (error) {
        console.error('Error saving to history:', error);
        saveToLocalStorage(filename, url, totalPages);
    }
}

function saveToLocalStorage(filename, url, totalPages) {
    const existing = pdfHistory.find(item => item.url === url);
    
    if (existing) {
        existing.updated_at = new Date().toISOString();
        existing.access_count = (existing.access_count || 0) + 1;
    } else {
        pdfHistory.unshift({
            id: Date.now(),
            filename,
            url,
            total_pages: totalPages,
            last_page: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            access_count: 1
        });
        
        if (pdfHistory.length > 50) {
            pdfHistory = pdfHistory.slice(0, 50);
        }
    }
    
    localStorage.setItem('pdfHistory', JSON.stringify(pdfHistory));
    renderHistory();
}

function renderHistory() {
    if (!historyGrid) return;
    
    if (historySection) historySection.style.display = 'block';
    
    if (pdfHistory.length === 0) {
        historyGrid.innerHTML = `
            <div class="history-empty">
                <i class="fas fa-inbox" style="font-size: 3rem; opacity: 0.3; margin-bottom: 1rem; display: block;"></i>
                <p>Aucun PDF enregistré.</p>
                <p style="font-size: 0.9rem; margin-top: 0.5rem; opacity: 0.7;">Chargez un document pour commencer.</p>
            </div>
        `;
        return;
    }
    
    historyGrid.innerHTML = pdfHistory.map(item => `
        <div class="history-item" data-url="${encodeURIComponent(item.url)}" data-id="${item.id}">
            <div class="history-item-header">
                <div style="display: flex; align-items: flex-start; flex: 1; min-width: 0;">
                    <div class="history-item-icon">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <div class="history-item-info">
                        <div class="history-item-name" title="${item.filename}">
                            ${item.filename || 'Document PDF'}
                        </div>
                        <div class="history-item-meta">
                            ${item.total_pages ? `<span><i class="fas fa-file"></i> ${item.total_pages} pages</span>` : ''}
                            ${item.updated_at ? `<span><i class="fas fa-clock"></i> ${formatDate(item.updated_at)}</span>` : ''}
                        </div>
                    </div>
                </div>
            </div>
            <button class="history-item-delete" data-id="${item.id}" data-filename="${item.filename}" title="Supprimer">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    document.querySelectorAll('.history-item').forEach(item => {
        const deleteBtn = item.querySelector('.history-item-delete');
        
        item.addEventListener('click', (e) => {
            if (e.target.closest('.history-item-delete')) return;
            
            const url = decodeURIComponent(item.dataset.url);
            if (urlInput) urlInput.value = url;
            if (urlBtn) urlBtn.click();
        });
        
        if (deleteBtn) {
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const id = deleteBtn.dataset.id;
                const filename = deleteBtn.dataset.filename;
                showDeleteModal(id, filename);
            });
        }
    });
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `Il y a ${diffMins} min`;
    if (diffHours < 24) return `Il y a ${diffHours}h`;
    if (diffDays < 7) return `Il y a ${diffDays}j`;
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function showDeleteModal(id, filename) {
    deleteItemId = id;
    if (deleteModalText) {
        deleteModalText.textContent = `Êtes-vous sûr de vouloir supprimer "${filename}" de l'historique ?`;
    }
    if (deleteModal) {
        deleteModal.classList.add('active');
    }
}

function hideDeleteModal() {
    deleteItemId = null;
    if (deleteModal) {
        deleteModal.classList.remove('active');
    }
}

async function deletePdfFromHistory(id) {
    try {
        const response = await fetch(`/api/history/${id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            await loadHistory();
        }
    } catch (error) {
        console.error('Error deleting from history:', error);
        pdfHistory = pdfHistory.filter(item => item.id != id);
        localStorage.setItem('pdfHistory', JSON.stringify(pdfHistory));
        renderHistory();
    }
    
    hideDeleteModal();
}

async function clearAllHistory() {
    if (!confirm('Êtes-vous sûr de vouloir effacer tout l\'historique ?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/history', {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (data.success) {
            pdfHistory = [];
            renderHistory();
        }
    } catch (error) {
        console.error('Error clearing history:', error);
        pdfHistory = [];
        localStorage.setItem('pdfHistory', JSON.stringify(pdfHistory));
        renderHistory();
    }
}

// History event listeners
if (historyClearBtn) {
    historyClearBtn.addEventListener('click', clearAllHistory);
}

if (deleteModalCancel) {
    deleteModalCancel.addEventListener('click', hideDeleteModal);
}

if (deleteModalConfirm) {
    deleteModalConfirm.addEventListener('click', () => {
        if (deleteItemId) {
            deletePdfFromHistory(deleteItemId);
        }
    });
}

if (deleteModal) {
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            hideDeleteModal();
        }
    });
}

// ==========================================
// INITIALIZATION
// ==========================================

loadHistory();

console.log('✅ PDF Reader with StPageFlip loaded');
console.log('📖 Ready to load PDFs');
