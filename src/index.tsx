import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'

type Bindings = {
  DB?: D1Database
  DOCUMENTS: KVNamespace
  PDFS: R2Bucket
  ADMIN_PASSWORD: string
  // AI Configuration (encrypted Gemini API key stored in KV)
  GEMINI_API_KEY?: string
}

const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS
app.use('/api/*', cors())

// Serve static files
app.use('/static/*', serveStatic({ root: './public' }))

// API Routes for PDF History

// Get all PDFs in history
app.get('/api/history', async (c) => {
  try {
    const db = c.env.DB
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    const { results } = await db.prepare(
      'SELECT * FROM pdf_history ORDER BY updated_at DESC LIMIT 50'
    ).all()
    
    return c.json({ success: true, data: results })
  } catch (error) {
    console.error('Error fetching history:', error)
    return c.json({ success: false, error: 'Failed to fetch history' }, 500)
  }
})

// Add or update PDF in history
app.post('/api/history', async (c) => {
  try {
    const db = c.env.DB
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    const body = await c.req.json()
    const { filename, url, file_size, mime_type, total_pages, last_page } = body
    
    // Check if URL already exists
    const existing = await db.prepare(
      'SELECT id FROM pdf_history WHERE url = ?'
    ).bind(url).first()
    
    if (existing) {
      // Update existing record
      await db.prepare(
        'UPDATE pdf_history SET filename = ?, last_page = ?, access_count = access_count + 1, updated_at = CURRENT_TIMESTAMP WHERE url = ?'
      ).bind(filename, last_page || 1, url).run()
      
      return c.json({ success: true, action: 'updated', id: existing.id })
    } else {
      // Insert new record
      const result = await db.prepare(
        'INSERT INTO pdf_history (filename, url, file_size, mime_type, total_pages, last_page) VALUES (?, ?, ?, ?, ?, ?)'
      ).bind(filename, url, file_size || 0, mime_type || 'application/pdf', total_pages || 0, last_page || 1).run()
      
      return c.json({ success: true, action: 'created', id: result.meta.last_row_id })
    }
  } catch (error) {
    console.error('Error saving to history:', error)
    return c.json({ success: false, error: 'Failed to save to history' }, 500)
  }
})

// Delete PDF from history
app.delete('/api/history/:id', async (c) => {
  try {
    const db = c.env.DB
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    const id = c.req.param('id')
    
    await db.prepare(
      'DELETE FROM pdf_history WHERE id = ?'
    ).bind(id).run()
    
    return c.json({ success: true, message: 'PDF deleted from history' })
  } catch (error) {
    console.error('Error deleting from history:', error)
    return c.json({ success: false, error: 'Failed to delete from history' }, 500)
  }
})

// Clear all history
app.delete('/api/history', async (c) => {
  try {
    const db = c.env.DB
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    await db.prepare('DELETE FROM pdf_history').run()
    
    return c.json({ success: true, message: 'History cleared' })
  } catch (error) {
    console.error('Error clearing history:', error)
    return c.json({ success: false, error: 'Failed to clear history' }, 500)
  }
})

// ==========================================
// DOCUMENT LIBRARY API ROUTES
// ==========================================

// Password hashing utilities using Web Crypto API
async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password + salt)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

function generateSalt(): string {
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  return Array.from(array).map(b => b.toString(16).padStart(2, '0')).join('')
}

async function verifyPassword(password: string, storedHash: string, salt: string): Promise<boolean> {
  const hash = await hashPassword(password, salt)
  return hash === storedHash
}

// Admin authentication
app.post('/api/admin/login', async (c) => {
  try {
    const { password } = await c.req.json()
    const kv = c.env.DOCUMENTS
    const adminPassword = c.env.ADMIN_PASSWORD
    
    // Check if custom password exists in KV
    const customPassword = await kv.get('admin_password_hash')
    
    if (customPassword) {
      // Custom password set - verify against KV
      const passwordData = JSON.parse(customPassword)
      const isValid = await verifyPassword(password, passwordData.hash, passwordData.salt)
      
      if (isValid) {
        return c.json({ success: true, message: 'Authentication successful' })
      }
    }
    
    // Fallback to master password from Cloudflare Secret (if configured)
    if (adminPassword && password === adminPassword) {
      return c.json({ success: true, message: 'Authentication successful' })
    }
    
    // If no custom password and no master password, reject
    if (!customPassword && !adminPassword) {
      return c.json({ success: false, error: 'No password configured. Please configure ADMIN_PASSWORD secret.' }, 500)
    }
    
    return c.json({ success: false, error: 'Invalid password' }, 401)
  } catch (error) {
    console.error('Login error:', error)
    return c.json({ success: false, error: 'Login failed' }, 500)
  }
})

// Change admin password
app.post('/api/admin/change-password', async (c) => {
  try {
    const { currentPassword, newPassword } = await c.req.json()
    const kv = c.env.DOCUMENTS
    const adminPassword = c.env.ADMIN_PASSWORD
    
    if (!currentPassword || !newPassword) {
      return c.json({ success: false, error: 'Current and new passwords are required' }, 400)
    }
    
    // Validate new password strength
    if (newPassword.length < 12) {
      return c.json({ success: false, error: 'New password must be at least 12 characters' }, 400)
    }
    
    // Verify current password
    const customPassword = await kv.get('admin_password_hash')
    let isCurrentPasswordValid = false
    
    if (customPassword) {
      const passwordData = JSON.parse(customPassword)
      isCurrentPasswordValid = await verifyPassword(currentPassword, passwordData.hash, passwordData.salt)
    }
    
    // Fallback to master password (if configured)
    if (!isCurrentPasswordValid && adminPassword && currentPassword === adminPassword) {
      isCurrentPasswordValid = true
    }
    
    if (!isCurrentPasswordValid) {
      return c.json({ success: false, error: 'Current password is incorrect' }, 401)
    }
    
    // Generate salt and hash new password
    const salt = generateSalt()
    const hash = await hashPassword(newPassword, salt)
    
    // Store in KV
    await kv.put('admin_password_hash', JSON.stringify({
      hash,
      salt,
      updatedAt: new Date().toISOString()
    }))
    
    return c.json({ 
      success: true, 
      message: 'Password changed successfully',
      updatedAt: new Date().toISOString()
    })
  } catch (error) {
    console.error('Password change error:', error)
    return c.json({ success: false, error: 'Failed to change password' }, 500)
  }
})

// Get password info (does not return actual password)
app.get('/api/admin/password-info', async (c) => {
  try {
    const kv = c.env.DOCUMENTS
    const customPassword = await kv.get('admin_password_hash')
    
    if (customPassword) {
      const passwordData = JSON.parse(customPassword)
      return c.json({
        success: true,
        hasCustomPassword: true,
        lastUpdated: passwordData.updatedAt || 'Unknown'
      })
    }
    
    return c.json({
      success: true,
      hasCustomPassword: false,
      lastUpdated: null
    })
  } catch (error) {
    console.error('Password info error:', error)
    return c.json({ success: false, error: 'Failed to get password info' }, 500)
  }
})

// Upload PDF to R2
app.post('/api/admin/upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const file = formData.get('file') as File
    const description = formData.get('description') as string || ''
    
    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400)
    }
    
    // Generate unique token for sharing
    const token = crypto.randomUUID()
    const r2Key = `pdfs/${token}.pdf`
    
    // Upload to R2
    const pdfs = c.env.PDFS
    await pdfs.put(r2Key, file.stream())
    
    // Store metadata in D1
    const db = c.env.DB
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    await db.prepare(`
      INSERT INTO documents (token, filename, description, r2_key, size, views)
      VALUES (?, ?, ?, ?, ?, 0)
    `).bind(token, file.name, description, r2Key, file.size).run()
    
    return c.json({ 
      success: true, 
      token,
      shareUrl: `${new URL(c.req.url).origin}/view?doc=${token}`
    })
  } catch (error) {
    console.error('Upload error:', error)
    return c.json({ success: false, error: 'Upload failed' }, 500)
  }
})

// Batch Upload PDF files to R2
app.post('/api/admin/batch-upload', async (c) => {
  try {
    const formData = await c.req.formData()
    const files = formData.getAll('files') as File[]
    const description = formData.get('description') as string || ''
    
    if (!files || files.length === 0) {
      return c.json({ success: false, error: 'No files provided' }, 400)
    }

    console.log(`📦 Batch upload started: ${files.length} files`)
    
    const db = c.env.DB
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    const pdfs = c.env.PDFS
    const results = []
    const errors = []
    
    // Process files sequentially to avoid memory issues
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      
      try {
        // Validate file type
        if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
          errors.push({
            filename: file.name,
            error: 'Not a PDF file'
          })
          continue
        }
        
        // Generate unique token
        const token = crypto.randomUUID()
        const r2Key = `pdfs/${token}.pdf`
        
        // Upload to R2
        await pdfs.put(r2Key, file.stream())
        
        // Store metadata in D1
        await db.prepare(`
          INSERT INTO documents (token, filename, description, r2_key, size, views)
          VALUES (?, ?, ?, ?, ?, 0)
        `).bind(token, file.name, description, r2Key, file.size).run()
        
        results.push({
          success: true,
          filename: file.name,
          token,
          shareUrl: `${new URL(c.req.url).origin}/view?doc=${token}`,
          size: file.size
        })
        
        console.log(`✅ Uploaded ${i + 1}/${files.length}: ${file.name}`)
        
      } catch (error: any) {
        console.error(`❌ Error uploading ${file.name}:`, error)
        errors.push({
          filename: file.name,
          error: error.message || 'Upload failed'
        })
      }
    }
    
    return c.json({
      success: true,
      total: files.length,
      uploaded: results.length,
      failed: errors.length,
      results,
      errors
    })
    
  } catch (error: any) {
    console.error('Batch upload error:', error)
    return c.json({ 
      success: false, 
      error: `Batch upload failed: ${error.message}` 
    }, 500)
  }
})

// Get all documents (admin only) with search, folder, and tags filters
app.get('/api/admin/documents', async (c) => {
  try {
    const db = c.env.DB
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    // Get query parameters
    const search = c.req.query('search') || ''
    const folder = c.req.query('folder') || ''
    const tagsFilter = c.req.query('tags') || ''
    
    // Build WHERE clause dynamically
    let query = 'SELECT * FROM documents WHERE 1=1'
    const bindings: (string | number)[] = []
    
    // Search filter (filename, description, tags, or client_tags)
    if (search) {
      query += ' AND (filename LIKE ? OR description LIKE ? OR tags LIKE ? OR client_tags LIKE ?)'
      const searchPattern = `%${search}%`
      bindings.push(searchPattern, searchPattern, searchPattern, searchPattern)
    }
    
    // Folder filter
    if (folder) {
      query += ' AND folder = ?'
      bindings.push(folder)
    }
    
    // Tags filter (check if tag exists in JSON array)
    if (tagsFilter) {
      query += ' AND tags LIKE ?'
      bindings.push(`%"${tagsFilter}"%`)
    }
    
    query += ' ORDER BY created_at DESC'
    
    const { results } = await db.prepare(query).bind(...bindings).all()
    
    return c.json({ success: true, documents: results })
  } catch (error) {
    console.error('Error fetching documents:', error)
    return c.json({ success: false, error: 'Failed to fetch documents' }, 500)
  }
})

// Update document metadata (description, tags, folder) - admin only
app.patch('/api/admin/documents/:token/description', async (c) => {
  try {
    const token = c.req.param('token')
    const body = await c.req.json()
    const db = c.env.DB
    
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    // Extract fields from body
    const { description, tags, folder, filename, client_tags } = body
    
    // Build UPDATE query dynamically
    const updates: string[] = []
    const bindings: (string | number)[] = []
    
    if (filename !== undefined) {
      updates.push('filename = ?')
      bindings.push(filename || '')
    }
    
    if (description !== undefined) {
      updates.push('description = ?')
      bindings.push(description || '')
    }
    
    if (tags !== undefined) {
      updates.push('tags = ?')
      bindings.push(JSON.stringify(tags))
    }
    
    if (folder !== undefined) {
      updates.push('folder = ?')
      bindings.push(folder || '')
    }
    
    if (client_tags !== undefined) {
      updates.push('client_tags = ?')
      bindings.push(JSON.stringify(client_tags))
    }
    
    if (updates.length === 0) {
      return c.json({ success: false, error: 'No fields to update' }, 400)
    }
    
    // Always update updated_at
    updates.push('updated_at = CURRENT_TIMESTAMP')
    
    // Execute update
    const query = `UPDATE documents SET ${updates.join(', ')} WHERE token = ?`
    bindings.push(token)
    
    await db.prepare(query).bind(...bindings).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating document:', error)
    return c.json({ success: false, error: 'Update failed' }, 500)
  }
})

// Update only client_tags for a document (admin only)
app.patch('/api/admin/documents/:token/client-tags', async (c) => {
  try {
    const token = c.req.param('token')
    const { client_tags } = await c.req.json()
    const db = c.env.DB
    
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    // Validate client_tags is an array
    if (!Array.isArray(client_tags)) {
      return c.json({ success: false, error: 'client_tags must be an array' }, 400)
    }
    
    // Update client_tags
    await db.prepare(`
      UPDATE documents 
      SET client_tags = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE token = ?
    `).bind(JSON.stringify(client_tags), token).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Error updating client tags:', error)
    return c.json({ success: false, error: 'Failed to update client tags' }, 500)
  }
})

// Get all unique client_tags across all documents (for autocomplete)
app.get('/api/admin/client-tags', async (c) => {
  try {
    const db = c.env.DB
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    // Get all documents with client_tags
    const { results } = await db.prepare(`
      SELECT client_tags FROM documents WHERE client_tags != '[]'
    `).all()
    
    // Aggregate all unique tags
    const tagsSet = new Set<string>()
    results.forEach((doc: any) => {
      try {
        const tags = JSON.parse(doc.client_tags || '[]')
        tags.forEach((tag: string) => tagsSet.add(tag))
      } catch (e) {
        // Ignore parse errors
      }
    })
    
    return c.json({ 
      success: true, 
      tags: Array.from(tagsSet).sort() 
    })
  } catch (error) {
    console.error('Error fetching client tags:', error)
    return c.json({ success: false, error: 'Failed to fetch client tags' }, 500)
  }
})

// Delete document (admin only)
app.delete('/api/admin/documents/:token', async (c) => {
  try {
    const token = c.req.param('token')
    const db = c.env.DB
    const pdfs = c.env.PDFS
    
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    // Get document metadata
    const doc = await db.prepare(`
      SELECT * FROM documents WHERE token = ?
    `).bind(token).first()
    
    if (!doc) {
      return c.json({ success: false, error: 'Document not found' }, 404)
    }
    
    // Delete from R2
    await pdfs.delete(doc.r2_key as string)
    
    // Delete from D1
    await db.prepare(`
      DELETE FROM documents WHERE token = ?
    `).bind(token).run()
    
    return c.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return c.json({ success: false, error: 'Delete failed' }, 500)
  }
})

// Get PDF by token (public access)
app.get('/api/documents/:token', async (c) => {
  try {
    const token = c.req.param('token')
    const db = c.env.DB
    const pdfs = c.env.PDFS
    
    if (!db) {
      return c.json({ error: 'Database not configured' }, 500)
    }
    
    // Get document metadata
    const doc = await db.prepare(`
      SELECT * FROM documents WHERE token = ?
    `).bind(token).first()
    
    if (!doc) {
      return c.json({ success: false, error: 'Document not found' }, 404)
    }
    
    // Increment view count
    await db.prepare(`
      UPDATE documents SET views = views + 1 WHERE token = ?
    `).bind(token).run()
    
    // Get PDF from R2
    const object = await pdfs.get(doc.r2_key as string)
    if (!object) {
      return c.json({ success: false, error: 'PDF file not found' }, 404)
    }
    
    // Return PDF with RFC 5987 encoded filename for Unicode support
    const encodedFilename = encodeURIComponent(doc.filename)
    return new Response(object.body, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${doc.filename}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error) {
    console.error('Error fetching document:', error)
    return c.json({ success: false, error: 'Failed to fetch document' }, 500)
  }
})

// Main page - Secure Landing Page (No Public Upload)
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Training Storybook - Solution de visualisation interactive</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link href="/static/tailwind.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            html, body {
                margin: 0;
                padding: 0;
                width: 100%;
                min-height: 100%;
                scroll-behavior: smooth;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
                color: #ffffff;
                overflow-x: hidden;
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 2rem;
            }
            
            .header {
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(20px);
                padding: 1.5rem 2rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                position: sticky;
                top: 0;
                z-index: 100;
            }
            
            .logo {
                font-size: 1.8rem;
                font-weight: 600;
                letter-spacing: -0.02em;
            }
            
            .hero {
                text-align: center;
                padding: 4rem 2rem;
                max-width: 900px;
                margin: 0 auto;
            }
            
            .hero h1 {
                font-size: 3rem;
                font-weight: 700;
                margin-bottom: 1.5rem;
                letter-spacing: -0.02em;
                line-height: 1.2;
            }
            
            .hero .subtitle {
                font-size: 1.3rem;
                opacity: 0.8;
                margin-bottom: 2rem;
                line-height: 1.6;
            }
            
            .cta-buttons {
                display: flex;
                gap: 1rem;
                justify-content: center;
                flex-wrap: wrap;
                margin-top: 2rem;
            }
            
            .btn {
                padding: 1rem 2rem;
                border-radius: 12px;
                border: none;
                font-size: 1rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
            }
            
            .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(59, 130, 246, 0.4);
            }
            
            .btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.15);
                border-color: rgba(255, 255, 255, 0.3);
            }
            
            .btn-donate {
                background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
                color: white;
            }
            
            .btn-donate:hover {
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(34, 197, 94, 0.4);
            }
            
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 2rem;
                margin: 4rem 0;
            }
            
            .feature-card {
                background: rgba(255, 255, 255, 0.05);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 2rem;
                transition: all 0.3s ease;
            }
            
            .feature-card:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: rgba(255, 255, 255, 0.2);
                transform: translateY(-5px);
            }
            
            .feature-icon {
                font-size: 2.5rem;
                margin-bottom: 1rem;
                display: block;
            }
            
            .demo-section {
                margin: 4rem 0;
                padding: 2rem;
                background: rgba(0, 0, 0, 0.3);
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .demo-section h2 {
                font-size: 2rem;
                margin-bottom: 1.5rem;
                text-align: center;
            }
            
            .demo-iframe {
                width: 100%;
                height: 800px;
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 15px;
                background: #000;
            }
            
            @media (max-width: 768px) {
                .hero h1 {
                    font-size: 2rem;
                }
                
                .hero .subtitle {
                    font-size: 1.1rem;
                }
                
                .demo-iframe {
                    height: 600px;
                }
            }
            
            /* PDF Viewer */
            .viewer-container {
                display: none;
                flex-direction: column;
                height: 100vh;
                background: #000;
            }
            
            .viewer-container.active {
                display: flex;
            }
            
            .viewer-header {
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(20px);
                padding: 1rem 2rem;
                display: flex;
                align-items: center;
                justify-content: space-between;
                z-index: 200;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .viewer-controls {
                display: flex;
                gap: 1rem;
                align-items: center;
            }
            
            .control-btn {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                color: white;
                padding: 0.6rem 1.2rem;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 0.9rem;
            }
            
            .control-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .control-btn:disabled {
                opacity: 0.3;
                cursor: not-allowed;
            }
            
            .page-info {
                font-size: 0.95rem;
                opacity: 0.8;
                min-width: 120px;
                text-align: center;
            }
            
            .canvas-container {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;  /* Hide scrollbars */
                position: relative;
                padding: 1rem;
                perspective: 2000px;
                width: 100%;
                box-sizing: border-box;
            }
            
            @media (max-width: 768px) {
                .canvas-container {
                    padding: 0.5rem;
                }
            }
            
            .book-container {
                position: relative;
                transform-style: preserve-3d;
                max-width: 100%;
                max-height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: transform 0.6s ease;
            }
            
            .book-container.closed {
                transform: scale(0.85);
            }
            
            .book-container.opening {
                animation: bookOpen 0.8s ease forwards;
            }
            
            @keyframes bookOpen {
                0% {
                    transform: scale(0.85);
                }
                100% {
                    transform: scale(1);
                }
            }
            
            .page-wrapper {
                position: relative;
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5);
                transition: box-shadow 0.6s ease;
            }
            
            .page-wrapper.closed {
                box-shadow: 0 5px 30px rgba(0, 0, 0, 0.7);
            }
            
            .page-wrapper.closed::before {
                content: '';
                position: absolute;
                top: 0;
                right: 0;
                width: 8px;
                height: 100%;
                background: linear-gradient(to right,
                    rgba(0, 0, 0, 0.3),
                    rgba(0, 0, 0, 0.05));
                pointer-events: none;
                z-index: 60;
            }
            
            .page-wrapper::after {
                content: '';
                position: absolute;
                top: 0;
                left: 50%;
                width: 2px;
                height: 100%;
                background: linear-gradient(to bottom,
                    rgba(0, 0, 0, 0.3),
                    rgba(0, 0, 0, 0.15) 30%,
                    rgba(0, 0, 0, 0.15) 70%,
                    rgba(0, 0, 0, 0.3));
                transform: translateX(-50%);
                pointer-events: none;
                z-index: 50;
            }
            
            #pdf-canvas {
                display: block;
                background: white;
                max-width: 100%;
                max-height: 100%;
                width: auto;
                height: auto;
                object-fit: contain;
            }
            
            /* StPageFlip Styles */
            #flipbook {
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden; /* No scrollbars on flipbook */
            }
            
            /* Hide scrollbars on all StPageFlip elements */
            .stf__parent,
            .stf__wrapper {
                overflow: hidden !important;
            }
            
            /* Hide scrollbars globally for viewer */
            .viewer-container {
                overflow: hidden;
            }
            
            /* Ensure no scrollbars appear during animations */
            .viewer-container * {
                scrollbar-width: none; /* Firefox */
                -ms-overflow-style: none; /* IE/Edge */
            }
            
            .viewer-container *::-webkit-scrollbar {
                display: none; /* Chrome/Safari */
            }
            
            .page {
                background: white;
                display: flex;
                align-items: center;
                justify-content: center;
                overflow: hidden;
            }
            
            .page canvas {
                width: 100%;
                height: 100%;
                display: block;
                object-fit: contain; /* Preserve aspect ratio */
            }
            
            .stf__parent {
                box-shadow: 0 10px 50px rgba(0, 0, 0, 0.5) !important;
                perspective: 2000px;
            }
            
            .stf__item {
                background-color: white;
            }
            
            .stf__outerShadow {
                opacity: 0.8 !important;
            }
            
            .stf__innerShadow {
                opacity: 0.5 !important;
            }
            
            .stf__hardShadow {
                opacity: 0.3 !important;
            }
            
            .stf__hardInnerShadow {
                opacity: 0.2 !important;
            }
            
            .book-closed-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.3s ease;
                z-index: 70;
                backdrop-filter: blur(3px);
            }
            
            .book-container.closed .book-closed-overlay {
                opacity: 1;
                pointer-events: auto;
                cursor: pointer;
            }
            
            .open-book-hint {
                text-align: center;
                color: white;
                animation: pulse 2s ease-in-out infinite;
            }
            
            @keyframes pulse {
                0%, 100% {
                    transform: scale(1);
                    opacity: 1;
                }
                50% {
                    transform: scale(1.05);
                    opacity: 0.8;
                }
            }
            
            .page-turning {
                position: absolute;
                top: 0;
                right: 0;
                pointer-events: none;
                transform-origin: left center;
                transform-style: preserve-3d;
                transition: transform 0.8s cubic-bezier(0.645, 0.045, 0.355, 1);
                box-shadow: -10px 0 30px rgba(0, 0, 0, 0.3);
            }
            
            .page-turning.active {
                animation: pageTurn 0.8s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
            }
            
            .page-turning.reverse {
                animation: pageTurnReverse 0.8s cubic-bezier(0.645, 0.045, 0.355, 1) forwards;
            }
            
            @keyframes pageTurn {
                0% {
                    transform: rotateY(0deg);
                }
                100% {
                    transform: rotateY(-180deg);
                }
            }
            
            @keyframes pageTurnReverse {
                0% {
                    transform: rotateY(-180deg);
                }
                100% {
                    transform: rotateY(0deg);
                }
            }
            
            .spine {
                position: absolute;
                top: 0;
                left: 50%;
                width: 2px;
                height: 100%;
                background: linear-gradient(to bottom, 
                    rgba(0, 0, 0, 0.3),
                    rgba(0, 0, 0, 0.1) 50%,
                    rgba(0, 0, 0, 0.3));
                transform: translateX(-50%);
                z-index: 10;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            }
            
            .loading {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                font-size: 1.2rem;
                opacity: 0.7;
            }
            
            .spinner {
                border: 3px solid rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                border-top: 3px solid white;
                width: 40px;
                height: 40px;
                animation: spin 1s linear infinite;
                margin: 0 auto 1rem;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            /* Fullscreen mode */
            .viewer-container.fullscreen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100vw;
                height: 100vh;
                z-index: 9999;
            }
            
            .viewer-container.fullscreen .viewer-header {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                opacity: 0;
                transition: opacity 0.3s ease;
            }
            
            .viewer-container.fullscreen:hover .viewer-header {
                opacity: 1;
            }
            
            /* Hidden file input */
            #file-input {
                display: none;
            }
            
            /* Dark Mode */
            body.dark-mode {
                background: linear-gradient(135deg, #000000 0%, #0a0a0a 100%);
            }
            
            body.dark-mode .viewer-container {
                background: #050505;
            }
            
            body.dark-mode .upload-card {
                background: rgba(255, 255, 255, 0.03);
                border-color: rgba(255, 255, 255, 0.15);
            }
            
            /* Thumbnail Panel */
            .thumbnail-panel {
                display: none;
                position: fixed;
                top: 80px;
                right: 20px;
                width: 300px;
                max-height: calc(100vh - 100px);
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 15px;
                z-index: 300;
                overflow-y: auto;
                overflow-x: hidden;
                padding: 1rem;
            }
            
            .thumbnail-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }
            
            .thumbnail-item {
                position: relative;
                cursor: pointer;
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                overflow: hidden;
                transition: all 0.2s ease;
            }
            
            .thumbnail-item:hover {
                border-color: rgba(255, 255, 255, 0.5);
                transform: scale(1.05);
            }
            
            .thumbnail-item.active {
                border-color: #3b82f6;
                box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
            }
            
            .thumbnail-item canvas {
                width: 100%;
                display: block;
            }
            
            .thumbnail-label {
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(0, 0, 0, 0.8);
                padding: 0.25rem;
                text-align: center;
                font-size: 0.75rem;
            }
            
            /* Book mode layout for thumbnails */
            .thumbnail-grid.book-mode {
                display: flex;
                flex-direction: column;
                gap: 1rem;
                width: 100%;
            }
            
            .thumbnail-row {
                display: flex;
                gap: 0.5rem;
                justify-content: center;
                align-items: flex-start;
                width: 100%;
            }
            
            .thumbnail-row .thumbnail-item {
                flex: 0 1 auto;
                max-width: 48%;
                min-width: 0;
            }
            
            .thumbnail-row .thumbnail-item:only-child {
                max-width: 60%;
            }
            
            .bookmark-icon {
                position: absolute;
                top: 5px;
                right: 5px;
                color: #fbbf24;
                font-size: 1rem;
                z-index: 10;
                filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
            }
            
            /* Search Panel */
            .search-panel {
                display: none;
                position: fixed;
                top: 80px;
                right: 20px;
                width: 350px;
                max-height: calc(100vh - 100px);
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 15px;
                z-index: 300;
                overflow: hidden;
                display: flex;
                flex-direction: column;
            }
            
            .search-header {
                padding: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .search-input-group {
                display: flex;
                gap: 0.5rem;
            }
            
            .search-input {
                flex: 1;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 0.5rem;
                color: white;
                font-size: 0.9rem;
            }
            
            .search-btn {
                background: rgba(59, 130, 246, 0.8);
                border: none;
                border-radius: 8px;
                padding: 0.5rem 1rem;
                color: white;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .search-btn:hover {
                background: rgba(59, 130, 246, 1);
            }
            
            .search-results {
                flex: 1;
                overflow-y: auto;
            }
            
            .search-result-item {
                padding: 1rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .search-result-item:hover {
                background: rgba(255, 255, 255, 0.1);
            }
            
            /* Goto Panel */
            .goto-panel {
                display: none;
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 300px;
                background: rgba(0, 0, 0, 0.95);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 15px;
                z-index: 400;
                padding: 2rem;
            }
            
            .goto-input {
                width: 100%;
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 8px;
                padding: 0.75rem;
                color: white;
                font-size: 1.2rem;
                text-align: center;
                margin-bottom: 1rem;
            }
            
            .goto-btn {
                width: 100%;
                background: rgba(59, 130, 246, 0.8);
                border: none;
                border-radius: 8px;
                padding: 0.75rem;
                color: white;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s ease;
            }
            
            .goto-btn:hover {
                background: rgba(59, 130, 246, 1);
            }
            
            /* Progress Bar */
            .loading {
                flex-direction: column;
                align-items: center;
                justify-content: center;
            }
            
            .progress-container {
                width: 200px;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
                margin-top: 1rem;
            }
            
            .progress-bar {
                height: 100%;
                background: linear-gradient(90deg, #3b82f6, #8b5cf6);
                border-radius: 2px;
                transition: width 0.3s ease;
                width: 0%;
            }
            
            .progress-text {
                margin-top: 0.5rem;
                font-size: 0.9rem;
                opacity: 0.8;
            }
            
            /* Scrollbar Styling */
            .thumbnail-panel::-webkit-scrollbar,
            .search-results::-webkit-scrollbar {
                width: 6px;
            }
            
            .thumbnail-panel::-webkit-scrollbar-track,
            .search-results::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
            }
            
            .thumbnail-panel::-webkit-scrollbar-thumb,
            .search-results::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.3);
                border-radius: 3px;
            }
            
            .thumbnail-panel::-webkit-scrollbar-thumb:hover,
            .search-results::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.5);
            }
            
            /* PDF History Styles */
            .history-section {
                width: calc(100% - 4rem);
                max-width: 1400px;
                background: rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(20px);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 15px;
                padding: 2rem;
                flex: 1 1 auto;
                min-height: 250px;
                max-height: 500px;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            
            .history-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .history-title {
                font-size: 1.1rem;
                font-weight: 500;
                letter-spacing: 0.05em;
            }
            
            .history-clear-btn {
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.4);
                color: #ef4444;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                cursor: pointer;
                font-size: 0.85rem;
                transition: all 0.2s ease;
            }
            
            .history-clear-btn:hover {
                background: rgba(239, 68, 68, 0.3);
            }
            
            .history-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 1.5rem;
                flex: 1;
                overflow-y: auto;
            }
            
            @media (max-width: 768px) {
                .history-grid {
                    grid-template-columns: 1fr;
                }
            }
            
            .history-item {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.2s ease;
                position: relative;
            }
            
            .history-item:hover {
                background: rgba(255, 255, 255, 0.1);
                border-color: rgba(255, 255, 255, 0.3);
                transform: translateY(-2px);
            }
            
            .history-item-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 0.5rem;
            }
            
            .history-item-icon {
                font-size: 2rem;
                opacity: 0.7;
                margin-right: 0.75rem;
                flex-shrink: 0;
            }
            
            .history-item-info {
                flex: 1;
                min-width: 0;
            }
            
            .history-item-name {
                font-size: 0.95rem;
                font-weight: 500;
                margin-bottom: 0.25rem;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
            }
            
            .history-item-meta {
                font-size: 0.75rem;
                opacity: 0.6;
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
            }
            
            .history-item-delete {
                position: absolute;
                top: 0.75rem;
                right: 0.75rem;
                background: rgba(239, 68, 68, 0.2);
                border: 1px solid rgba(239, 68, 68, 0.4);
                color: #ef4444;
                width: 28px;
                height: 28px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                opacity: 0;
                transition: all 0.2s ease;
                z-index: 10;
            }
            
            .history-item:hover .history-item-delete {
                opacity: 1;
            }
            
            .history-item-delete:hover {
                background: rgba(239, 68, 68, 0.4);
                transform: scale(1.1);
            }
            
            .history-empty {
                text-align: center;
                padding: 2rem;
                opacity: 0.5;
            }
            
            /* Delete Modal */
            .delete-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                backdrop-filter: blur(10px);
                z-index: 9999;
                align-items: center;
                justify-content: center;
            }
            
            .delete-modal.active {
                display: flex;
            }
            
            .delete-modal-content {
                background: rgba(20, 20, 20, 0.95);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 15px;
                padding: 2rem;
                max-width: 400px;
                width: 90%;
            }
            
            .delete-modal-title {
                font-size: 1.3rem;
                font-weight: 500;
                margin-bottom: 1rem;
                color: #ef4444;
            }
            
            .delete-modal-text {
                margin-bottom: 1.5rem;
                opacity: 0.8;
                line-height: 1.5;
            }
            
            .delete-modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
            }
            
            .delete-modal-btn {
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                font-size: 0.95rem;
                transition: all 0.2s ease;
            }
            
            .delete-modal-btn-cancel {
                background: rgba(255, 255, 255, 0.1);
                color: white;
            }
            
            .delete-modal-btn-cancel:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .delete-modal-btn-confirm {
                background: #ef4444;
                color: white;
            }
            
            .delete-modal-btn-confirm:hover {
                background: #dc2626;
            }
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <div style="max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
                <div class="logo">📚 Training Storybook</div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <a href="/en" class="btn btn-secondary" style="padding: 0.5rem 1rem;">
                        <i class="fas fa-language"></i> EN
                    </a>
                    <a href="/admin" class="btn btn-secondary">
                        <i class="fas fa-lock"></i> Administration
                    </a>
                </div>
            </div>
        </div>

        <!-- Hero Section -->
        <div class="container">
            <div class="hero">
                <h1>📖 Visualisez et gérez vos contenus pédagogiques<br/>avec intelligence artificielle</h1>
                <p class="subtitle">
                    Solution complémentaire à Gemini Storybook. Viewer interactif avec effet page tournée + bibliothèque intelligente powered by Gemini 2.5 Flash.
                </p>
                
                <div class="cta-buttons">
                    <a href="/admin" class="btn btn-primary">
                        <i class="fas fa-rocket"></i> Accéder à l'Admin
                    </a>
                    <a href="https://github.com/Atalantis/training-storybook" target="_blank" class="btn btn-secondary">
                        <i class="fab fa-github"></i> Voir sur GitHub
                    </a>
                    <a href="https://pots.lydia.me/collect/pots?id=54317-storybook-reader" target="_blank" class="btn btn-donate">
                        <i class="fas fa-heart"></i> Soutenir le Projet
                    </a>
                </div>
            </div>

            <!-- Features -->
            <div class="feature-grid">
                <div class="feature-card">
                    <span class="feature-icon">🌐</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Partageable via URL</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Générez des liens publics uniques pour chaque document. Parfait pour les formations à distance.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🎨</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Effet Page Tournée</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Animation fluide de page tournée basée sur StPageFlip. Expérience de lecture naturelle.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🔓</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">100% Open Source</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Code source libre (MIT License). Déployez sur votre propre infrastructure Cloudflare.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">📱</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Responsive Design</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Fonctionne parfaitement sur desktop, tablette et mobile. Interface adaptative.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">⚡</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Edge Déployé</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Hébergé sur Cloudflare Pages. Latence minimale, performance maximale.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🎓</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Mission Pédagogique</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Conçu pour démocratiser l'accès aux outils de formation professionnels.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🤖</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Analyse IA Automatique</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Suggestions intelligentes de métadonnées via Gemini 2.5 Flash. OCR intégré pour documents scannés. Rapide (5-7s) et gratuit.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">📚</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Bibliothèque Organisée</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Système complet de tags, dossiers hiérarchiques, et tags clients. Recherche avancée et filtres puissants.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🏷️</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Tags Clients Personnalisés</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Classez vos documents par client, projet ou toute classification personnelle. Totalement indépendant des tags de contenu.
                    </p>
                </div>
            </div>

            <!-- Demo Section -->
            <div class="demo-section">
                <h2><i class="fas fa-play-circle"></i> Démo Interactive</h2>
                <p style="text-align: center; opacity: 0.8; margin-bottom: 2rem; font-size: 1.1rem;">
                    Découvrez l'expérience de lecture avec effet de page tournée :
                </p>
                <iframe 
                    src="/view?doc=21edaf29-7fc6-4478-9e00-e63f8afccfe5" 
                    class="demo-iframe"
                    allowfullscreen 
                    title="Démonstration du viewer Training Storybook">
                </iframe>
                <p style="text-align: center; opacity: 0.6; margin-top: 1rem; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Utilisez les boutons de navigation ou cliquez sur les bords pour tourner les pages
                </p>
            </div>

            <!-- Mission Section -->
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; padding: 3rem 2rem; margin: 4rem 0; text-align: center;">
                <h2 style="font-size: 2rem; margin-bottom: 1.5rem;">💚 Notre Mission Pédagogique</h2>
                <p style="font-size: 1.2rem; line-height: 1.8; opacity: 0.9; max-width: 800px; margin: 0 auto 2rem;">
                    <strong>Training Storybook</strong> est une alternative <strong>libre et gratuite</strong> à Gemini Storybook, 
                    conçue pour rendre les outils de formation interactifs accessibles à tous. 
                    <br/><br/>
                    Nous croyons que les supports pédagogiques de qualité ne doivent pas être enfermés dans des plateformes propriétaires.
                </p>
                
                <div style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
                    <div>
                        <i class="fas fa-check-circle" style="color: #22c55e; font-size: 1.5rem;"></i>
                        <p style="margin-top: 0.5rem; font-weight: 600;">Exportable & Autonome</p>
                    </div>
                    <div>
                        <i class="fas fa-code-branch" style="color: #3b82f6; font-size: 1.5rem;"></i>
                        <p style="margin-top: 0.5rem; font-weight: 600;">Open Source (MIT)</p>
                    </div>
                    <div>
                        <i class="fas fa-globe" style="color: #8b5cf6; font-size: 1.5rem;"></i>
                        <p style="margin-top: 0.5rem; font-weight: 600;">Iframe-Ready</p>
                    </div>
                    <div>
                        <i class="fas fa-shield-alt" style="color: #f59e0b; font-size: 1.5rem;"></i>
                        <p style="margin-top: 0.5rem; font-weight: 600;">Pas de Blocage Tiers</p>
                    </div>
                </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; padding: 3rem 2rem; background: rgba(255, 255, 255, 0.03); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <h2 style="font-size: 2rem; margin-bottom: 1.5rem;">🚀 Prêt à Démarrer ?</h2>
                <p style="font-size: 1.1rem; opacity: 0.8; margin-bottom: 2rem;">
                    Accédez à l'administration pour uploader vos premiers storybooks
                </p>
                <a href="/admin" class="btn btn-primary" style="font-size: 1.1rem; padding: 1.25rem 2.5rem;">
                    <i class="fas fa-sign-in-alt"></i> Connexion Admin
                </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; opacity: 0.6;">
                <p style="margin-bottom: 1rem;">
                    Développé avec ❤️ par <a href="https://www.linkedin.com/in/fsiegenthaler/" target="_blank" style="color: #3b82f6; text-decoration: none;">Florent Siegenthaler</a> · 
                    <a href="mailto:florent@insuractio.com" style="color: #3b82f6; text-decoration: none;">florent@insuractio.com</a>
                </p>
                <p style="font-size: 0.9rem;">
                    <a href="https://github.com/Atalantis/training-storybook" target="_blank" style="color: rgba(255,255,255,0.6); text-decoration: none; margin: 0 1rem;">
                        <i class="fab fa-github"></i> GitHub
                    </a>
                    <a href="https://pots.lydia.me/collect/pots?id=54317-storybook-reader" target="_blank" style="color: rgba(255,255,255,0.6); text-decoration: none; margin: 0 1rem;">
                        <i class="fas fa-donate"></i> Faire un Don
                    </a>
                </p>
                <p style="font-size: 0.85rem; margin-top: 1rem;">
                    Bibliothèques tierces : StPageFlip (MIT) · PDF.js (Apache 2.0) · pdf-lib (MIT) · Hono (MIT) · TailwindCSS (MIT)
                </p>
            </div>
        </div>
    </body>
    </html>
  `)
})

// English landing page
app.get('/en', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Training Storybook - Interactive Page-Flip PDF Viewer</title>
        <meta name="description" content="Complementary solution to Gemini Storybook. Interactive page-flip viewer + smart library powered by Gemini 2.5 Flash.">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #0f0f0f 0%, #1a1a1a 100%);
                color: white;
                min-height: 100vh;
                line-height: 1.6;
            }
            
            .header {
                background: rgba(0, 0, 0, 0.2);
                backdrop-filter: blur(10px);
                padding: 1.5rem 2rem;
                position: sticky;
                top: 0;
                z-index: 100;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .logo {
                font-size: 1.5rem;
                font-weight: 700;
            }
            
            .container {
                max-width: 1400px;
                margin: 0 auto;
                padding: 4rem 2rem;
            }
            
            .hero {
                text-align: center;
                margin-bottom: 4rem;
            }
            
            .hero h1 {
                font-size: 3rem;
                margin-bottom: 1.5rem;
                line-height: 1.2;
                font-weight: 800;
            }
            
            .subtitle {
                font-size: 1.3rem;
                opacity: 0.9;
                max-width: 800px;
                margin: 0 auto 2.5rem;
                line-height: 1.6;
            }
            
            .cta-buttons {
                display: flex;
                gap: 1.5rem;
                justify-content: center;
                flex-wrap: wrap;
            }
            
            .btn {
                padding: 1rem 2rem;
                border-radius: 12px;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 1.1rem;
                font-weight: 600;
                transition: all 0.3s ease;
                border: 2px solid transparent;
            }
            
            .btn-primary {
                background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
                color: white;
            }
            
            .btn-primary:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .btn-secondary {
                background: rgba(255, 255, 255, 0.1);
                color: white;
                border-color: rgba(255, 255, 255, 0.3);
            }
            
            .btn-secondary:hover {
                background: rgba(255, 255, 255, 0.2);
                transform: translateY(-2px);
            }
            
            .btn-donate {
                background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                color: white;
            }
            
            .btn-donate:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(245, 87, 108, 0.4);
            }
            
            .feature-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin: 4rem 0;
            }
            
            .feature-card {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 2rem;
                border-radius: 20px;
                border: 1px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
            }
            
            .feature-card:hover {
                transform: translateY(-5px);
                background: rgba(255, 255, 255, 0.15);
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            }
            
            .feature-icon {
                font-size: 3rem;
                display: block;
                margin-bottom: 1rem;
            }
            
            .demo-section {
                background: rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                border-radius: 20px;
                padding: 3rem 2rem;
                margin: 4rem 0;
                border: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .demo-section h2 {
                text-align: center;
                font-size: 2.5rem;
                margin-bottom: 1.5rem;
            }
            
            .demo-iframe {
                width: 100%;
                height: 600px;
                border: none;
                border-radius: 15px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            
            @media (max-width: 768px) {
                .hero h1 {
                    font-size: 2rem;
                }
                
                .subtitle {
                    font-size: 1.1rem;
                }
                
                .cta-buttons {
                    flex-direction: column;
                }
                
                .demo-iframe {
                    height: 400px;
                }
            }
        </style>
    </head>
    <body>
        <!-- Header -->
        <div class="header">
            <div style="max-width: 1400px; margin: 0 auto; display: flex; justify-content: space-between; align-items: center;">
                <div class="logo">📚 Training Storybook</div>
                <div style="display: flex; gap: 1rem; align-items: center;">
                    <a href="/" class="btn btn-secondary" style="padding: 0.5rem 1rem;">
                        <i class="fas fa-language"></i> FR
                    </a>
                    <a href="/admin" class="btn btn-secondary">
                        <i class="fas fa-lock"></i> Admin
                    </a>
                </div>
            </div>
        </div>

        <!-- Hero Section -->
        <div class="container">
            <div class="hero">
                <h1>📖 Visualize and manage your training content<br/>with artificial intelligence</h1>
                <p class="subtitle">
                    Complementary solution to Gemini Storybook. Interactive page-flip viewer + smart library powered by Gemini 2.5 Flash.
                </p>
                
                <div class="cta-buttons">
                    <a href="/admin" class="btn btn-primary">
                        <i class="fas fa-rocket"></i> Access Admin
                    </a>
                    <a href="https://github.com/Atalantis/training-storybook" target="_blank" class="btn btn-secondary">
                        <i class="fab fa-github"></i> View on GitHub
                    </a>
                    <a href="https://pots.lydia.me/collect/pots?id=54317-storybook-reader" target="_blank" class="btn btn-donate">
                        <i class="fas fa-heart"></i> Support the Project
                    </a>
                </div>
            </div>

            <!-- Features -->
            <div class="feature-grid">
                <div class="feature-card">
                    <span class="feature-icon">🌐</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Shareable via URL</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Generate unique public links for each document. Perfect for remote training.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🎨</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Page-Flip Effect</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Smooth page-flip animation based on StPageFlip. Natural reading experience.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🔓</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">100% Open Source</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Free source code (MIT License). Deploy on your own Cloudflare infrastructure.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">📱</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Responsive Design</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Works perfectly on desktop, tablet, and mobile. Adaptive interface.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">⚡</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Edge Deployed</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Hosted on Cloudflare Pages. Minimal latency, maximum performance.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🎓</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Educational Mission</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Designed to democratize access to professional training tools.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🤖</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Automatic AI Analysis</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Smart metadata suggestions via Gemini 2.5 Flash. Integrated OCR for scanned documents. Fast (5-7s) and free.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">📚</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Organized Library</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Complete system of tags, hierarchical folders, and client tags. Advanced search and powerful filters.
                    </p>
                </div>
                
                <div class="feature-card">
                    <span class="feature-icon">🏷️</span>
                    <h3 style="font-size: 1.3rem; margin-bottom: 0.75rem;">Custom Client Tags</h3>
                    <p style="opacity: 0.8; line-height: 1.6;">
                        Classify your documents by client, project, or any personal classification. Fully independent from content tags.
                    </p>
                </div>
            </div>

            <!-- Demo Section -->
            <div class="demo-section">
                <h2><i class="fas fa-play-circle"></i> Interactive Demo</h2>
                <p style="text-align: center; opacity: 0.8; margin-bottom: 2rem; font-size: 1.1rem;">
                    Experience the page-flip reading effect:
                </p>
                <iframe 
                    src="/view?doc=21edaf29-7fc6-4478-9e00-e63f8afccfe5" 
                    class="demo-iframe"
                    allowfullscreen 
                    title="Training Storybook viewer demonstration">
                </iframe>
                <p style="text-align: center; opacity: 0.6; margin-top: 1rem; font-size: 0.9rem;">
                    <i class="fas fa-info-circle"></i> Use navigation buttons or click on edges to flip pages
                </p>
            </div>

            <!-- Mission Section -->
            <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 20px; padding: 3rem 2rem; margin: 4rem 0; text-align: center;">
                <h2 style="font-size: 2rem; margin-bottom: 1.5rem;">💚 Our Educational Mission</h2>
                <p style="font-size: 1.2rem; line-height: 1.8; opacity: 0.9; max-width: 800px; margin: 0 auto 2rem;">
                    <strong>Training Storybook</strong> is a <strong>free and open-source</strong> alternative to Gemini Storybook, 
                    designed to make interactive training tools accessible to everyone. 
                    <br/><br/>
                    We believe that quality educational content should not be locked in proprietary platforms.
                </p>
                
                <div style="display: flex; gap: 1.5rem; justify-content: center; flex-wrap: wrap; margin-top: 2rem;">
                    <div>
                        <i class="fas fa-check-circle" style="color: #22c55e; font-size: 1.5rem;"></i>
                        <p style="margin-top: 0.5rem; font-weight: 600;">Exportable & Standalone</p>
                    </div>
                    <div>
                        <i class="fas fa-code-branch" style="color: #3b82f6; font-size: 1.5rem;"></i>
                        <p style="margin-top: 0.5rem; font-weight: 600;">Open Source (MIT)</p>
                    </div>
                    <div>
                        <i class="fas fa-globe" style="color: #8b5cf6; font-size: 1.5rem;"></i>
                        <p style="margin-top: 0.5rem; font-weight: 600;">Iframe-Ready</p>
                    </div>
                    <div>
                        <i class="fas fa-shield-alt" style="color: #f59e0b; font-size: 1.5rem;"></i>
                        <p style="margin-top: 0.5rem; font-weight: 600;">No Third-Party Lock-in</p>
                    </div>
                </div>
            </div>

            <!-- Call to Action -->
            <div style="text-align: center; padding: 3rem 2rem; background: rgba(255, 255, 255, 0.03); border-radius: 20px; border: 1px solid rgba(255, 255, 255, 0.1);">
                <h2 style="font-size: 2rem; margin-bottom: 1.5rem;">🚀 Ready to Start?</h2>
                <p style="font-size: 1.1rem; opacity: 0.8; margin-bottom: 2rem;">
                    Access the admin panel to upload your first storybooks
                </p>
                <a href="/admin" class="btn btn-primary" style="font-size: 1.1rem; padding: 1.25rem 2.5rem;">
                    <i class="fas fa-sign-in-alt"></i> Admin Login
                </a>
            </div>

            <!-- Footer -->
            <div style="margin-top: 4rem; padding-top: 2rem; border-top: 1px solid rgba(255, 255, 255, 0.1); text-align: center; opacity: 0.6;">
                <p style="margin-bottom: 1rem;">
                    Developed with ❤️ by <a href="https://www.linkedin.com/in/fsiegenthaler/" target="_blank" style="color: #3b82f6; text-decoration: none;">Florent Siegenthaler</a> · 
                    <a href="mailto:florent@insuractio.com" style="color: #3b82f6; text-decoration: none;">florent@insuractio.com</a>
                </p>
                <p style="font-size: 0.9rem;">
                    <a href="https://github.com/Atalantis/training-storybook" target="_blank" style="color: rgba(255,255,255,0.6); text-decoration: none; margin: 0 1rem;">
                        <i class="fab fa-github"></i> GitHub
                    </a>
                    <a href="https://pots.lydia.me/collect/pots?id=54317-storybook-reader" target="_blank" style="color: rgba(255,255,255,0.6); text-decoration: none; margin: 0 1rem;">
                        <i class="fas fa-donate"></i> Donate
                    </a>
                </p>
                <p style="font-size: 0.85rem; margin-top: 1rem;">
                    Third-party libraries: StPageFlip (MIT) · PDF.js (Apache 2.0) · pdf-lib (MIT) · Hono (MIT) · TailwindCSS (MIT)
                </p>
            </div>
        </div>
    </body>
    </html>
  `)
})

// Admin panel page
app.get('/admin', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Administration - Training Storybook</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg">
        <link href="/static/tailwind.css" rel="stylesheet">
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/pdf-lib@1.17.1/dist/pdf-lib.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/tesseract.js@5.0.5/dist/tesseract.min.js"></script>
        <script>
            // Configure pdf.js worker
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
            }
        </script>
        <style>
            #upload-form.drag-active,
            .drag-active {
                background: rgba(59, 130, 246, 0.1) !important;
                border: 2px dashed #3b82f6 !important;
                border-radius: 12px;
            }
        </style>
    </head>
    <body>
        <div id="app"></div>
        <script src="/static/admin.js?v=${Date.now()}"></script>
    </body>
    </html>
  `)
})

// Public view page for shared documents
app.get('/view', (c) => {
  const docToken = c.req.query('doc')
  
  if (!docToken) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="fr">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Document non trouvé</title>
          <link rel="icon" type="image/svg+xml" href="/favicon.svg">
          <link href="/static/tailwind.css" rel="stylesheet">
      </head>
      <body class="bg-gray-900 text-white flex items-center justify-center min-h-screen">
          <div class="text-center">
              <h1 class="text-3xl font-bold mb-4">Document non trouvé</h1>
              <p class="text-gray-400">Le lien que vous avez suivi n'est pas valide.</p>
          </div>
      </body>
      </html>
    `)
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="fr">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Document - Storybook Reader</title>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/viewer.css" rel="stylesheet">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/page-flip@2.0.7/dist/js/page-flip.browser.min.js"></script>
    </head>
    <body>
        <div id="loading">
            <div style="width: 64px; height: 64px; border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 1s linear infinite;"></div>
            <p id="loading-text">Chargement du document...</p>
        </div>
        
        <div id="viewer-container">
            <div class="viewer-header">
                <div class="viewer-controls">
                    <div class="page-info" id="page-info">Page 1 / 1</div>
                    
                    <div style="display: flex; gap: 0.5rem;">
                        <button class="control-btn" id="zoom-out-btn" title="Zoom arrière (-)">
                            <i class="fas fa-search-minus"></i>
                        </button>
                        <button class="control-btn" id="zoom-in-btn" title="Zoom avant (+)">
                            <i class="fas fa-search-plus"></i>
                        </button>
                        <button class="control-btn" id="fit-window-btn" title="Adapter à la fenêtre (0)">
                            <i class="fas fa-expand-arrows-alt"></i>
                        </button>
                        <button class="control-btn" id="fullscreen-btn" title="Plein écran (F)">
                            <i class="fas fa-expand"></i>
                        </button>
                        <button class="control-btn" id="thumbnails-btn" title="Miniatures (T)">
                            <i class="fas fa-th"></i>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="flipbook-wrapper">
                <div id="flipbook-container"></div>
            </div>
            
            <!-- Thumbnail Panel (inside viewer-container for fullscreen support) -->
            <div class="thumbnail-panel" id="thumbnail-panel">
                <div style="padding-bottom: 0.5rem; border-bottom: 1px solid rgba(255,255,255,0.2); margin-bottom: 1rem; font-weight: 500;">
                    <i class="fas fa-th"></i> Miniatures
                </div>
                <div class="thumbnail-grid" id="thumbnail-grid"></div>
            </div>
        </div>
        
        <style>
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
        </style>
        
        <script src="/static/viewer.js"></script>
    </body>
    </html>
  `)
})

// ==========================================
// AI CONFIGURATION - ENCRYPTION UTILITIES
// ==========================================

/**
 * Encrypt a secret using AES-GCM with a derived key
 */
async function encryptSecret(secret: string, key: CryptoKey): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(secret)
  
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  // Concatenate IV + encrypted data
  const combined = new Uint8Array(iv.length + encrypted.byteLength)
  combined.set(iv, 0)
  combined.set(new Uint8Array(encrypted), iv.length)
  
  // Convert to base64
  return btoa(String.fromCharCode(...combined))
}

/**
 * Decrypt a secret using AES-GCM with a derived key
 */
async function decryptSecret(encrypted: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encrypted), c => c.charCodeAt(0))
  
  const iv = combined.slice(0, 12)
  const data = combined.slice(12)
  
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
}

/**
 * Get encryption key derived from admin password hash
 */
async function getEncryptionKey(env: Bindings): Promise<CryptoKey> {
  // Use admin password hash as key material
  const kv = env.DOCUMENTS
  const customPassword = await kv.get('admin_password_hash')
  
  let keyMaterial: string
  if (customPassword) {
    const passwordData = JSON.parse(customPassword)
    keyMaterial = passwordData.hash
  } else {
    // Fallback to master password if no custom password
    keyMaterial = env.ADMIN_PASSWORD || 'default-fallback-key-material'
  }
  
  const encoder = new TextEncoder()
  const keyData = await crypto.subtle.importKey(
    'raw',
    encoder.encode(keyMaterial),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  )
  
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('training-storybook-ai-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyData,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  )
}

// ==========================================
// AI CONFIGURATION - ENDPOINTS
// ==========================================

/**
 * Set AI configuration (provider and API keys)
 * POST /api/admin/set-ai-config
 */
app.post('/api/admin/set-ai-config', async (c) => {
  try {
    const { geminiKey, enabled } = await c.req.json()
    const kv = c.env.DOCUMENTS

    // Get encryption key
    const encryptionKey = await getEncryptionKey(c.env)
    
    // Store AI enabled status (boolean as string)
    await kv.put('AI_ENABLED', enabled ? 'true' : 'false')
    
    // Encrypt and store Gemini API key
    if (geminiKey && geminiKey.trim().length > 0) {
      const encrypted = await encryptSecret(geminiKey, encryptionKey)
      await kv.put('GEMINI_API_KEY_ENCRYPTED', encrypted)
    }
    
    return c.json({ 
      success: true,
      message: 'Configuration IA Gemini enregistrée avec succès'
    })
    
  } catch (error) {
    console.error('AI Config Error:', error)
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la configuration'
    }, 500)
  }
})

/**
 * Get current AI configuration (without exposing keys)
 * GET /api/admin/ai-config
 */
app.get('/api/admin/ai-config', async (c) => {
  try {
    const kv = c.env.DOCUMENTS
    
    const enabled = (await kv.get('AI_ENABLED')) === 'true'
    const hasGeminiKey = !!(await kv.get('GEMINI_API_KEY_ENCRYPTED'))

    return c.json({
      success: true,
      enabled,
      hasGeminiKey
    })
  } catch (error) {
    console.error('Get AI Config Error:', error)
    return c.json({ 
      success: false, 
      error: 'Erreur lors de la récupération de la configuration'
    }, 500)
  }
})

/**
 * Get AI configuration with decrypted keys (internal use only)
 */
async function getAIConfig(env: Bindings): Promise<{ enabled: boolean; apiKey: string }> {
  const kv = env.DOCUMENTS
  const enabled = (await kv.get('AI_ENABLED')) === 'true'
  
  try {
    const encryptionKey = await getEncryptionKey(env)
    
    let apiKey = ''
    const encrypted = await kv.get('GEMINI_API_KEY_ENCRYPTED')
    if (encrypted) {
      apiKey = await decryptSecret(encrypted, encryptionKey)
    }
    
    return { enabled, apiKey }
    
  } catch (error) {
    console.error('Decryption Error:', error)
    return { enabled, apiKey: '' }
  }
}

// ==========================================
// AI ANALYSIS - PROVIDERS
// ==========================================

/**
 * Analyze PDF with Google Gemini (Flash or Pro)
 */
/**
 * Retry utility with exponential backoff and jitter
 * For 503 errors (overloaded) and network failures
 */
async function withRetry<T>(
  fn: () => Promise<T>, 
  options: { retries?: number; baseDelay?: number; maxDelay?: number } = {}
): Promise<T> {
  const { retries = 5, baseDelay = 500, maxDelay = 16000 } = options;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      const is503 = error.message?.includes('503') || error.message?.includes('overloaded');
      const isNetworkError = error.message?.includes('fetch') || error.message?.includes('network');
      const isLastAttempt = attempt === retries - 1;
      
      // Only retry on 503 or network errors
      if (!is503 && !isNetworkError) {
        throw error;
      }
      
      if (isLastAttempt) {
        console.error(`❌ Max retries (${retries}) reached for:`, error.message);
        throw error;
      }
      
      // Exponential backoff with jitter: delay = base * 2^attempt + random(0, 200ms)
      const exponentialDelay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      const jitter = Math.random() * 200;
      const delay = exponentialDelay + jitter;
      
      console.log(`⚠️ Retry ${attempt + 1}/${retries} after ${Math.round(delay)}ms (${error.message})`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Retry loop exhausted without success');
}

async function analyzeWithGemini(text: string, imageBase64: string | null, apiKey: string, isScanned: boolean = false, totalPages: number | null = null, sampledPages: number | null = null) {
  const hasText = text && text.trim().length > 0;
  const textContent = hasText 
    ? `Contenu du document :\n${text}` 
    : 'Note: Ce PDF est un scan/image, analyse le contenu visuel.';
    
  // Always use Gemini 2.5 Flash for metadata suggestion task
  // Reason: Flash is sufficient for this task (no deep reasoning needed)
  // Benefits: 3-4x faster, 15x cheaper, no MAX_TOKENS issues with thinking
  // Note: Pro's thinking tokens (500-2000) cause MAX_TOKENS even with 2048 limit
  const model = 'gemini-2.5-flash';
  
  console.log('🔍 Gemini Request:', {
    model,
    apiKeyPresent: !!apiKey,
    apiKeyLength: apiKey?.length || 0,
    hasText,
    textLength: text?.length || 0,
    hasImage: !!imageBase64,
    isScanned,
    totalPages,
    sampledPages
  })
    
  // Build context information
  let contextInfo = '';
  if (totalPages) {
    contextInfo += `\nDocument : ${totalPages} page(s) au total`;
    if (sampledPages && sampledPages < totalPages) {
      contextInfo += ` (${sampledPages} page(s) analysée(s) pour cette suggestion)`;
    }
  }
  if (isScanned) {
    contextInfo += '\nType : Document scanné (OCR appliqué)';
  }
  
  const parts: any[] = [
    {
      text: `Analyse ce document PDF et suggère des métadonnées au format JSON strict :
{
  "filename": "nom-descriptif.pdf",
  "description": "Description concise",
  "tags": ["tag1", "tag2"],
  "folder": "Catégorie/Sous-catégorie"
}

CONTEXTE :${contextInfo}

Règles :
- filename : kebab-case, max 50 caractères, extension .pdf
- description : factuelle, max 200 caractères${totalPages ? `, mentionne "${totalPages} pages"` : ''}
- tags : 3-5 mots-clés pertinents
- folder : hiérarchie logique avec "/" (ex: "Formation/Bancassurance")

${textContent}`
    }
  ]

  // Add image if available
  if (imageBase64) {
    parts.push({
      inline_data: {
        mime_type: 'image/jpeg',
        data: imageBase64
      }
    })
  }

  // Wrap Gemini API call with retry logic (handles 503 overload errors)
  const data = await withRetry(async () => {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048  // Increased for Gemini 2.5 Pro thinking tokens
          }
        })
      }
    )
    
    console.log('📡 Gemini Response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('❌ Gemini Error Body:', errorBody)
      throw new Error(`Gemini API Error: ${response.status} - ${errorBody}`)
    }

    return await response.json()
  }, { retries: 5, baseDelay: 1000, maxDelay: 16000 })
  
  // Log full response for debugging
  console.log('📦 Gemini Full Response:', JSON.stringify(data, null, 2))
  
  // Validate response structure
  if (!data.candidates || data.candidates.length === 0) {
    console.error('❌ Invalid response structure:', data)
    throw new Error('Gemini response has no candidates')
  }
  
  // Check for finish reason issues
  const candidate = data.candidates[0]
  if (candidate.finishReason === 'MAX_TOKENS') {
    console.error('❌ MAX_TOKENS reached:', {
      finishReason: candidate.finishReason,
      usageMetadata: data.usageMetadata
    })
    throw new Error('Gemini a atteint la limite de tokens. Le PDF est peut-être trop complexe.')
  }
  
  if (candidate.finishReason === 'SAFETY') {
    console.error('❌ Content blocked by safety filters:', candidate)
    throw new Error('Le contenu du PDF a été bloqué par les filtres de sécurité Gemini.')
  }
  
  if (!candidate.content || !candidate.content.parts) {
    console.error('❌ Invalid candidate structure:', candidate)
    throw new Error(`Gemini candidate has no content parts (finishReason: ${candidate.finishReason || 'unknown'})`)
  }
  
  if (data.candidates[0].content.parts.length === 0) {
    console.error('❌ Empty parts array:', data.candidates[0].content)
    throw new Error('Gemini response has no text parts')
  }
  
  const content = data.candidates[0].content.parts[0].text
  
  if (!content) {
    console.error('❌ No text in response:', data.candidates[0].content.parts[0])
    throw new Error('Gemini response text is empty')
  }
  
  console.log('📝 Gemini Text Response:', content.substring(0, 200))
  
  // Extract JSON from response
  const jsonMatch = content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    console.error('❌ No JSON found in response:', content)
    throw new Error('Format de réponse invalide - pas de JSON détecté')
  }

  return JSON.parse(jsonMatch[0])
}



/**
 * Test AI configuration
 * POST /api/admin/test-ai
 */
app.post('/api/admin/test-ai', async (c) => {
  try {
    const { enabled, apiKey } = await getAIConfig(c.env)
    
    console.log('🧪 Test AI Request:', {
      enabled,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0
    })
    
    if (!enabled) {
      return c.json({ 
        success: false, 
        error: 'L\'analyse IA est désactivée. Activez-la dans la configuration.' 
      }, 400)
    }

    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: 'Aucune clé API Gemini configurée' 
      }, 400)
    }
    
    // Test with Gemini 2.5 Flash
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: 'Dis "Test réussi"' }]
          }]
        })
      }
    )
    
    console.log('📡 Test Response:', {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText
    })
    
    if (!response.ok) {
      const errorBody = await response.text()
      console.error('❌ Test Error Body:', errorBody)
      throw new Error(`Test Gemini échoué: ${response.status} - ${errorBody}`)
    }
    
    const data = await response.json()
    return c.json({ 
      success: true, 
      provider: 'Gemini 2.5 Flash',
      sample: data.candidates[0].content.parts[0].text
    })
    
  } catch (error: any) {
    console.error('❌ Test AI Error:', error)
    return c.json({ 
      success: false, 
      error: error.message 
    }, 500)
  }
})

/**
 * Analyze PDF content with AI
 * POST /api/admin/analyze-pdf
 */
app.post('/api/admin/analyze-pdf', async (c) => {
  try {
    const { text, imageBase64, isScanned, totalPages, sampledPages } = await c.req.json()
    
    console.log('📄 Analyze PDF Request:', {
      hasText: !!(text && text.trim().length > 0),
      textLength: text?.length || 0,
      hasImage: !!imageBase64,
      isScanned,
      totalPages,
      sampledPages
    })
    
    // Accept PDFs with either text OR image (OCR case)
    if ((!text || text.trim().length === 0) && !imageBase64) {
      return c.json({ 
        success: false, 
        error: 'Le PDF ne contient ni texte ni image analysable' 
      }, 400)
    }

    // Get AI configuration (with decrypted key)
    const { enabled, apiKey } = await getAIConfig(c.env)
    
    console.log('🔑 AI Config Retrieved:', {
      enabled,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0
    })
    
    if (!enabled) {
      return c.json({ 
        success: false, 
        error: 'L\'analyse IA est désactivée. Activez-la dans Sécurité > Configuration IA.' 
      }, 400)
    }

    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: 'Clé API Gemini non configurée. Allez dans Sécurité > Configuration IA.' 
      }, 400)
    }

    let suggestions

    try {
      // Choose model based on content type
      // Pro for scanned PDFs/images (better vision), Flash for text-heavy PDFs (faster/cheaper)
      suggestions = await analyzeWithGemini(text, imageBase64, apiKey, isScanned, totalPages, sampledPages)
    } catch (error: any) {
      console.error('❌ AI Analysis Error:', {
        message: error.message,
        stack: error.stack,
        isScanned,
        textLength: text?.length || 0,
        hasImage: !!imageBase64
      })
      return c.json({ 
        success: false, 
        error: `Erreur Gemini: ${error.message}` 
      }, 500)
    }

    return c.json({
      success: true,
      suggestions: {
        filename: suggestions.filename || 'document.pdf',
        description: suggestions.description || '',
        tags: suggestions.tags || [],
        folder: suggestions.folder || ''
      }
    })

  } catch (error: any) {
    console.error('❌ Outer Analysis Error:', error)
    return c.json({ 
      success: false, 
      error: 'Erreur lors de l\'analyse IA'
    }, 500)
  }
})

// Batch AI Analysis for multiple PDFs
app.post('/api/admin/batch-analyze', async (c) => {
  try {
    const { documents } = await c.req.json()
    
    if (!Array.isArray(documents) || documents.length === 0) {
      return c.json({ 
        success: false, 
        error: 'No documents provided for analysis' 
      }, 400)
    }

    console.log(`🤖 Batch AI analysis started: ${documents.length} documents`)
    
    // Get AI configuration
    const { enabled, apiKey } = await getAIConfig(c.env)
    
    if (!enabled) {
      return c.json({ 
        success: false, 
        error: 'L\'analyse IA est désactivée. Activez-la dans Sécurité > Configuration IA.' 
      }, 400)
    }

    if (!apiKey) {
      return c.json({ 
        success: false, 
        error: 'Clé API Gemini non configurée.' 
      }, 400)
    }
    
    const results = []
    const errors = []
    
    // Process documents sequentially (rate limiting + avoid Gemini API throttling)
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i]
      
      try {
        const { text, imageBase64, isScanned, totalPages, sampledPages, filename, documentId } = doc
        
        // Validate document data
        if ((!text || text.trim().length === 0) && !imageBase64) {
          errors.push({
            filename: filename || `Document ${i + 1}`,
            documentId,
            error: 'Pas de contenu analysable'
          })
          continue
        }
        
        console.log(`🔍 Analyzing ${i + 1}/${documents.length}: ${filename}`)
        
        // Analyze with Gemini
        const suggestions = await analyzeWithGemini(
          text, 
          imageBase64, 
          apiKey, 
          isScanned, 
          totalPages, 
          sampledPages
        )
        
        results.push({
          success: true,
          filename: filename || `Document ${i + 1}`,
          documentId,
          suggestions: {
            filename: suggestions.filename || filename || 'document.pdf',
            description: suggestions.description || '',
            tags: suggestions.tags || [],
            folder: suggestions.folder || ''
          }
        })
        
        console.log(`✅ Analyzed ${i + 1}/${documents.length}: ${filename}`)
        
        // Small delay between requests to avoid rate limiting (Gemini Flash: 15 RPM)
        // 4 seconds = ~15 requests per minute
        if (i < documents.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 4000))
        }
        
      } catch (error: any) {
        console.error(`❌ Error analyzing document ${i + 1}:`, error)
        errors.push({
          filename: doc.filename || `Document ${i + 1}`,
          documentId: doc.documentId,
          error: error.message || 'Analysis failed'
        })
      }
    }
    
    return c.json({
      success: true,
      total: documents.length,
      analyzed: results.length,
      failed: errors.length,
      results,
      errors
    })
    
  } catch (error: any) {
    console.error('❌ Batch analysis error:', error)
    return c.json({ 
      success: false, 
      error: `Batch analysis failed: ${error.message}` 
    }, 500)
  }
})

export default app
