// ==========================================
// SHARED DOCUMENT VIEWER - PageFlip Integration
// ==========================================

// Get document token from URL
const urlParams = new URLSearchParams(window.location.search);
const DOC_TOKEN = urlParams.get('doc');

// PDF.js configuration
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Global state
let pdfDoc = null;
let pageFlip = null;
let currentZoom = 1.0;
let basePageWidth = 400;
let basePageHeight = 600;
let aspectRatio = 1.5;

// DOM elements
const loadingDiv = document.getElementById('loading');
const loadingText = document.getElementById('loading-text');
const viewerContainer = document.getElementById('viewer-container');
const flipbookContainer = document.getElementById('flipbook-container');
const pageInfo = document.getElementById('page-info');
const thumbnailsBtn = document.getElementById('thumbnails-btn');
const thumbnailPanel = document.getElementById('thumbnail-panel');
const thumbnailGrid = document.getElementById('thumbnail-grid');
const zoomInBtn = document.getElementById('zoom-in-btn');
const zoomOutBtn = document.getElementById('zoom-out-btn');
const fitWindowBtn = document.getElementById('fit-window-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');

// Update page info display
function updatePageInfo() {
    if (!pageFlip || !pageInfo) return;
    const currentPage = pageFlip.getCurrentPageIndex() + 1;
    const totalPages = pdfDoc ? pdfDoc.numPages : 0;
    pageInfo.textContent = `Page ${currentPage} / ${totalPages}`;
}

// Zoom functions using CSS transform
function zoomIn() {
    if (currentZoom >= 2.0) return;
    currentZoom += 0.2;
    applyZoom();
}

function zoomOut() {
    if (currentZoom <= 0.5) return;
    currentZoom -= 0.2;
    applyZoom();
}

function fitToWindow() {
    if (!pageFlip) return;
    
    // Get the actual header height dynamically
    const header = document.querySelector('.viewer-header');
    const headerHeight = header ? header.offsetHeight : 80;
    
    // Calculate available space (minus header and margins)
    const availableHeight = window.innerHeight - headerHeight - 40; // 40px margin top+bottom
    const availableWidth = window.innerWidth - 40; // 40px margin left+right
    
    // Get current PageFlip dimensions (unscaled)
    const currentWidth = basePageWidth * 2; // Double-page view
    const currentHeight = basePageHeight;
    
    // Calculate zoom to fit both width and height
    const zoomByWidth = availableWidth / currentWidth;
    const zoomByHeight = availableHeight / currentHeight;
    
    // Use the smaller zoom to ensure it fits completely
    currentZoom = Math.min(zoomByWidth, zoomByHeight);
    
    // Clamp zoom between reasonable limits
    currentZoom = Math.max(0.5, Math.min(2.0, currentZoom));
    
    console.log('Fit to window:', {
        availableWidth,
        availableHeight,
        currentWidth,
        currentHeight,
        zoomByWidth,
        zoomByHeight,
        finalZoom: currentZoom
    });
    
    applyZoom();
}

function applyZoom() {
    if (!flipbookContainer) return;
    
    // Apply CSS transform to scale the entire PageFlip container
    // Use 'center center' to center both horizontally and vertically
    flipbookContainer.style.transform = `scale(${currentZoom})`;
    flipbookContainer.style.transformOrigin = 'center center';
    
    console.log('Applied zoom:', currentZoom);
}

// Fullscreen toggle
function toggleFullscreen() {
    const elem = viewerContainer;
    
    // Check if already in fullscreen
    const isFullscreen = document.fullscreenElement || 
                        document.webkitFullscreenElement || 
                        document.mozFullScreenElement ||
                        document.msFullscreenElement;
    
    if (!isFullscreen) {
        // Enter fullscreen with vendor prefixes
        if (elem.requestFullscreen) {
            elem.requestFullscreen().catch(err => {
                console.error('Fullscreen error:', err);
                showMobileFullscreenFallback();
            });
        } else if (elem.webkitRequestFullscreen) {
            // Safari/iOS
            elem.webkitRequestFullscreen();
        } else if (elem.mozRequestFullScreen) {
            // Firefox
            elem.mozRequestFullScreen();
        } else if (elem.msRequestFullscreen) {
            // IE/Edge
            elem.msRequestFullscreen();
        } else {
            // Fallback for mobile browsers that don't support fullscreen API
            showMobileFullscreenFallback();
        }
    } else {
        // Exit fullscreen with vendor prefixes
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Fallback for mobile browsers without fullscreen API
function showMobileFullscreenFallback() {
    // Hide header temporarily for more space
    const header = document.querySelector('.viewer-header');
    if (header) {
        header.style.display = header.style.display === 'none' ? 'flex' : 'none';
    }
    
    // Adjust zoom to fill screen
    if (window.innerWidth < 768) {
        fitToWindow();
    }
}

// Toggle thumbnails panel
function toggleThumbnails() {
    if (!thumbnailPanel) return;
    const isVisible = thumbnailPanel.style.display === 'block';
    thumbnailPanel.style.display = isVisible ? 'none' : 'block';
}

// Generate thumbnails
async function generateThumbnails() {
    if (!pdfDoc || !thumbnailGrid) return;
    
    thumbnailGrid.innerHTML = '';
    const thumbScale = 0.3;
    thumbnailGrid.classList.add('book-mode');
    
    const totalPages = pdfDoc.numPages;
    
    // Page 1 (front cover) - alone
    const page1Container = document.createElement('div');
    page1Container.className = 'thumbnail-row';
    const thumb1 = await createThumbnail(1, thumbScale);
    page1Container.appendChild(thumb1);
    thumbnailGrid.appendChild(page1Container);
    
    // Pages 2 to N - in pairs
    let pageNum = 2;
    while (pageNum <= totalPages) {
        const rowContainer = document.createElement('div');
        rowContainer.className = 'thumbnail-row';
        
        const isLastPageAlone = (pageNum === totalPages && totalPages % 2 === 0);
        
        if (isLastPageAlone) {
            const thumbLast = await createThumbnail(pageNum, thumbScale);
            rowContainer.appendChild(thumbLast);
            thumbnailGrid.appendChild(rowContainer);
            break;
        } else {
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

// Create thumbnail
async function createThumbnail(pageNum, thumbScale) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale: thumbScale });
    
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = viewport.width;
    thumbCanvas.height = viewport.height;
    const thumbCtx = thumbCanvas.getContext('2d');
    
    thumbCtx.fillStyle = 'white';
    thumbCtx.fillRect(0, 0, thumbCanvas.width, thumbCanvas.height);
    
    await page.render({
        canvasContext: thumbCtx,
        viewport: viewport
    }).promise;
    
    const thumbContainer = document.createElement('div');
    thumbContainer.className = 'thumbnail-item';
    
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
            pageFlip.turnToPage(pageNum - 1);
            updatePageInfo();
            toggleThumbnails();
            generateThumbnails();
        }
    });
    
    return thumbContainer;
}

// Initialize PageFlip
async function initializePageFlip() {
    if (!pdfDoc || !flipbookContainer) return;
    
    // Get dimensions from first page
    const firstPage = await pdfDoc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.0 });
    
    // Calculate aspect ratio
    aspectRatio = viewport.height / viewport.width;
    
    // Calculate optimal dimensions based on available space
    // Mobile detection
    const isMobile = window.innerWidth < 768;
    
    // Adjust margins for mobile
    const headerHeight = isMobile ? 120 : 150;
    const sideMargins = isMobile ? 20 : 100;
    
    const availableHeight = window.innerHeight - headerHeight;
    const availableWidth = window.innerWidth - sideMargins;
    
    // For double-page view, we need 2x the width (unless mobile - single page)
    const pageMultiplier = isMobile ? 1.2 : 2.5;
    const maxWidthPerPage = availableWidth / pageMultiplier;
    const maxHeightPerPage = availableHeight * (isMobile ? 0.85 : 0.7);
    
    // Choose the limiting dimension
    let calculatedWidth = maxHeightPerPage / aspectRatio;
    if (calculatedWidth > maxWidthPerPage) {
        calculatedWidth = maxWidthPerPage;
    }
    
    // Smaller minimum for mobile
    const minWidth = isMobile ? 280 : 400;
    const maxWidth = isMobile ? 600 : 800;
    
    basePageWidth = Math.round(Math.max(minWidth, Math.min(maxWidth, calculatedWidth)));
    basePageHeight = Math.round(basePageWidth * aspectRatio);
    
    const pageWidth = Math.round(basePageWidth * currentZoom);
    const pageHeight = Math.round(basePageHeight * currentZoom);
    
    // Create PageFlip instance
    pageFlip = new St.PageFlip(flipbookContainer, {
        width: pageWidth,
        height: pageHeight,
        
        size: 'fixed',
        autoSize: false,
        minWidth: 315,
        maxWidth: 1000,
        minHeight: 400,
        maxHeight: 1533,
        
        drawShadow: true,
        maxShadowOpacity: 1,
        
        flippingTime: 800,
        usePortrait: false,  // Landscape mode for double-page
        startZIndex: 0,
        showCover: true,
        mobileScrollSupport: true,
        
        clickEventForward: true,
        useMouseEvents: true,
        swipeDistance: 30,
        showPageCorners: true,
        disableFlipByClick: false
    });
    
    // Render pages
    loadingText.textContent = 'Préparation des pages...';
    
    // IMPORTANT: Calculate render scale to match PageFlip dimensions exactly
    // This prevents offset/centering issues with object-fit: contain
    const firstPageViewport = await pdfDoc.getPage(1).then(p => p.getViewport({ scale: 1.0 }));
    const renderScale = basePageWidth / firstPageViewport.width;
    
    console.log('Render dimensions:', {
        basePageWidth,
        basePageHeight,
        pdfWidth: firstPageViewport.width,
        pdfHeight: firstPageViewport.height,
        calculatedScale: renderScale
    });
    
    // Create container for all pages
    const pagesContainer = document.createElement('div');
    pagesContainer.id = 'temp-pages-container';
    pagesContainer.style.display = 'none';
    document.body.appendChild(pagesContainer);
    
    for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
        const page = await pdfDoc.getPage(pageNum);
        
        // Use calculated scale to match PageFlip width exactly
        const viewport = page.getViewport({ scale: renderScale });
        
        const canvas = document.createElement('canvas');
        // Round to avoid sub-pixel rendering issues
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        const context = canvas.getContext('2d');
        
        context.fillStyle = 'white';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        await page.render({
            canvasContext: context,
            viewport: viewport
        }).promise;
        
        const pageDiv = document.createElement('div');
        pageDiv.className = 'page';
        
        // Set density for covers
        if (pageNum === 1 || pageNum === pdfDoc.numPages) {
            pageDiv.setAttribute('data-density', 'hard');
        } else {
            pageDiv.setAttribute('data-density', 'soft');
        }
        
        pageDiv.appendChild(canvas);
        pagesContainer.appendChild(pageDiv);
    }
    
    // Load all pages at once
    pageFlip.loadFromHTML(pagesContainer.querySelectorAll('.page'));
    
    // Event listeners
    pageFlip.on('flip', (e) => {
        updatePageInfo();
    });
    
    pageFlip.on('changeState', (e) => {
        console.log('Page flip state:', e.data);
    });
    
    // CRITICAL: Show closed book effect FIRST (before viewer becomes visible)
    // This ensures users see the 3D book animation before the open book
    await showClosedBookEffect();
    
    // Show viewer (will be hidden under overlay initially)
    loadingDiv.style.display = 'none';
    viewerContainer.classList.add('active');
    updatePageInfo();
    
    // Generate thumbnails in background (non-blocking)
    generateThumbnails(); // Remove await - don't block on thumbnails
}

// Load PDF from API
async function loadPDF() {
    try {
        loadingText.textContent = 'Chargement du document...';
        
        const response = await fetch(`/api/documents/${DOC_TOKEN}`);
        
        if (!response.ok) {
            throw new Error('Document non trouvé');
        }
        
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        
        loadingText.textContent = 'Analyse du PDF...';
        
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        pdfDoc = await loadingTask.promise;
        
        console.log('PDF loaded:', pdfDoc.numPages, 'pages');
        
        loadingText.textContent = 'Initialisation du lecteur...';
        await initializePageFlip();
        
    } catch (error) {
        console.error('Error loading PDF:', error);
        loadingText.textContent = 'Erreur: ' + error.message;
        loadingDiv.innerHTML = `
            <div class="text-center">
                <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
                <p class="text-xl text-white mb-2">Document introuvable</p>
                <p class="text-gray-400">${error.message}</p>
            </div>
        `;
    }
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (!viewerContainer || !viewerContainer.classList.contains('active') || !pageFlip) return;
    
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
            
        case '+':
        case '=':
            e.preventDefault();
            zoomIn();
            break;
            
        case '-':
        case '_':
            e.preventDefault();
            zoomOut();
            break;
            
        case '0':
            e.preventDefault();
            fitToWindow();
            break;
            
        case 'f':
        case 'F':
            e.preventDefault();
            toggleFullscreen();
            break;
    }
});

// Closed book effect with thickness
async function showClosedBookEffect() {
    if (!pdfDoc || !flipbookContainer) return;
    
    console.time('⏱️ Closed book cover render');
    
    // Render first page (cover) for preview at lower scale for speed
    const firstPage = await pdfDoc.getPage(1);
    const viewport = firstPage.getViewport({ scale: 1.0 }); // Reduced from 1.5 to 1.0 for speed
    
    const coverCanvas = document.createElement('canvas');
    coverCanvas.width = viewport.width;
    coverCanvas.height = viewport.height;
    const ctx = coverCanvas.getContext('2d');
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, coverCanvas.width, coverCanvas.height);
    
    await firstPage.render({
        canvasContext: ctx,
        viewport: viewport
    }).promise;
    
    console.timeEnd('⏱️ Closed book cover render');
    
    // Create closed book overlay
    const overlay = document.createElement('div');
    overlay.id = 'closed-book-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: opacity 0.5s ease;
    `;
    
    // Create 3D book container
    const bookContainer = document.createElement('div');
    bookContainer.style.cssText = `
        position: relative;
        width: ${basePageWidth * 1.2}px;
        height: ${basePageHeight * 1.2}px;
        perspective: 2000px;
        transform-style: preserve-3d;
    `;
    
    // Create book wrapper for 3D effect
    const book3D = document.createElement('div');
    book3D.style.cssText = `
        position: relative;
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        transform: rotateY(-15deg) rotateX(5deg);
        transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
        animation: bookFloat 3s ease-in-out infinite;
    `;
    
    // Front cover
    const frontCover = document.createElement('div');
    frontCover.style.cssText = `
        position: absolute;
        width: 100%;
        height: 100%;
        background: white;
        box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.5),
            inset -5px 0 15px rgba(0, 0, 0, 0.2);
        border-radius: 0 8px 8px 0;
        overflow: hidden;
        transform-style: preserve-3d;
    `;
    
    // Add rendered cover image
    coverCanvas.style.cssText = `
        width: 100%;
        height: 100%;
        object-fit: cover;
    `;
    frontCover.appendChild(coverCanvas);
    
    // Book spine (thickness effect)
    const numPages = pdfDoc.numPages;
    const spineThickness = Math.min(50, Math.max(20, numPages * 0.5)); // 20-50px based on page count
    
    const spine = document.createElement('div');
    spine.style.cssText = `
        position: absolute;
        left: 0;
        top: 0;
        width: ${spineThickness}px;
        height: 100%;
        background: linear-gradient(to right, 
            #2c2c2c 0%, 
            #4a4a4a 20%, 
            #5a5a5a 50%, 
            #4a4a4a 80%, 
            #2c2c2c 100%
        );
        transform-origin: right center;
        transform: translateX(-100%) rotateY(-90deg);
        box-shadow: 
            inset 0 0 20px rgba(0, 0, 0, 0.5),
            -5px 0 15px rgba(0, 0, 0, 0.3);
        border-radius: 8px 0 0 8px;
    `;
    
    // Add page edges effect
    const pageEdges = document.createElement('div');
    pageEdges.style.cssText = `
        position: absolute;
        right: 0;
        top: 5%;
        width: ${spineThickness - 5}px;
        height: 90%;
        background: repeating-linear-gradient(
            to bottom,
            #f5f5f5 0px,
            #e0e0e0 1px,
            #f5f5f5 2px
        );
        transform-origin: left center;
        transform: translateX(-100%) rotateY(-90deg) translateZ(1px);
        box-shadow: inset 2px 0 5px rgba(0, 0, 0, 0.2);
    `;
    spine.appendChild(pageEdges);
    
    // Click instruction overlay
    const instruction = document.createElement('div');
    instruction.style.cssText = `
        position: absolute;
        bottom: -80px;
        left: 50%;
        transform: translateX(-50%);
        color: white;
        font-size: 1.2rem;
        font-weight: 500;
        text-align: center;
        animation: pulse 2s ease-in-out infinite;
        text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    `;
    instruction.innerHTML = `
        <i class="fas fa-hand-pointer" style="font-size: 2rem; display: block; margin-bottom: 0.5rem;"></i>
        Cliquez pour ouvrir le livre
    `;
    
    // Assemble 3D book
    book3D.appendChild(spine);
    book3D.appendChild(frontCover);
    bookContainer.appendChild(book3D);
    bookContainer.appendChild(instruction);
    overlay.appendChild(bookContainer);
    document.body.appendChild(overlay);
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bookFloat {
            0%, 100% { transform: rotateY(-15deg) rotateX(5deg) translateY(0); }
            50% { transform: rotateY(-15deg) rotateX(5deg) translateY(-10px); }
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        #closed-book-overlay:hover #closed-book-overlay > div > div {
            transform: rotateY(-5deg) rotateX(2deg) scale(1.05);
        }
    `;
    document.head.appendChild(style);
    
    // Click to open animation
    overlay.addEventListener('click', () => {
        // Simple fade out animation (no flip)
        overlay.style.opacity = '0';
        
        // Remove overlay and navigate to first content page
        setTimeout(() => {
            overlay.remove();
            
            // Navigate PageFlip to first content page (page 1 in PageFlip = page 2-3 spread)
            // PageFlip uses 0-based index, page 1 shows pages 2-3 in spread mode
            if (pageFlip && pdfDoc && pdfDoc.numPages > 1) {
                // Turn to page 1 (which displays pages 2-3 in double-page mode)
                pageFlip.turnToPage(1);
                updatePageInfo();
            }
        }, 500);
    });
}

// Event listeners
if (thumbnailsBtn) {
    thumbnailsBtn.addEventListener('click', toggleThumbnails);
}

if (zoomInBtn) {
    zoomInBtn.addEventListener('click', zoomIn);
}

if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', zoomOut);
}

if (fitWindowBtn) {
    fitWindowBtn.addEventListener('click', fitToWindow);
}

if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
}

// Start loading
if (DOC_TOKEN) {
    window.addEventListener('DOMContentLoaded', loadPDF);
} else {
    loadingDiv.innerHTML = `
        <div class="text-center">
            <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
            <p class="text-xl text-white mb-2">Lien invalide</p>
            <p class="text-gray-400">Le document demandé n'existe pas.</p>
        </div>
    `;
}
