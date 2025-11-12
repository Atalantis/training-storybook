# 📚 Storybook Reader

> **Complete solution for viewing and sharing interactive PDF storybooks**  
> Free and exportable alternative to Gemini Storybook for standalone educational presentations

[![Production](https://img.shields.io/badge/status-production-brightgreen)](https://training-storybook.pages.dev)
[![Cloudflare](https://img.shields.io/badge/cloudflare-pages-orange)](https://pages.cloudflare.com)
[![License](https://img.shields.io/badge/license-private-red)](LICENSE)

---

## 🎯 Concept & Problem Statement

### Gemini Storybook: Innovative but Limited

Google Gemini offers an experimental **"Storybook"** feature ([gemini.google.com/gem/storybook](https://gemini.google.com/gem/storybook)) for creating personalized illustrated books via AI:

![Gemini Storybook](https://page.gensparksite.com/v1/base64_upload/a2b1efd1852cdd9cc6bb401e04ae5779)

**Example generated storybook**: [BRUT.pdf](https://page.gensparksite.com/get_upload_url/21441d2c5496065b8787b67c98bb53cdde8189e10893c684da0eb4363edbedd6/default/e6475bb4-37df-4513-9842-c3ed6d8a8322) (raw export from Gemini)

### ❌ Gemini Storybook Limitations

1. **Not exportable**: Cannot download the interactive viewer
2. **No iframe support**: Impossible to embed in websites, LMS, or third-party apps
3. **Access blocked**: Many corporate environments block access to `gemini.google.com`
4. **Not standalone**: Requires active Google connection
5. **Privacy concerns**: Documents hosted on Google servers

### ✅ Our Solution: Storybook Reader

**Storybook Reader** solves these problems by offering:

- ✅ **Free export**: Autonomous hosting on your Cloudflare infrastructure
- ✅ **Iframe-ready**: Seamless integration in any web context
- ✅ **Universal access**: Works even in restricted environments
- ✅ **Standalone**: No external dependencies or authentication required
- ✅ **Privacy**: Your data remains under your control

---

## 🎬 Live Demo

### Iframe Integration Example

Here's an example of an embedded storybook directly in this documentation:

<iframe src="https://training-storybook.pages.dev/view?doc=21edaf29-7fc6-4478-9e00-e63f8afccfe5" width="100%" height="800" frameborder="0" allowfullscreen style="border: 1px solid #ccc; border-radius: 8px;"></iframe>

**Integration code**:
```html
<iframe 
  src="https://training-storybook.pages.dev/view?doc=21edaf29-7fc6-4478-9e00-e63f8afccfe5" 
  width="100%" 
  height="800" 
  frameborder="0" 
  allowfullscreen 
  style="border: 1px solid #ccc; border-radius: 8px;">
</iframe>
```

### 🔗 Direct Access

- **Public URL**: [Open storybook](https://training-storybook.pages.dev/view?doc=21edaf29-7fc6-4478-9e00-e63f8afccfe5)
- **Admin panel**: [/admin](https://training-storybook.pages.dev/admin)

---

## 🎯 Key Features

### 📖 Interactive PageFlip Reader
- **Realistic book effect**: Professional page-turning animation
- **Intuitive navigation**: Keyboard (arrows), touch (swipe), buttons
- **Dynamic zoom**: +/- and automatic window fit
- **Fullscreen mode**: Compatible with all browsers (desktop + mobile)
- **Thumbnails panel**: Quick navigation with preview
- **Responsive**: Desktop (double-page) / Mobile (optimized single-page)
- **Keyboard shortcuts**: ←/→ (navigation), +/- (zoom), Esc (fullscreen)

### 🔄 PDF Converter A3→A5
- **Automatic splitting**: Horizontal split A3 landscape → 2 A5 portrait pages
- **"Skip first page" option**: Removes first A5 page (useful for blank pages)
- **Adjustable quality**: 72 DPI (low), 150 DPI (medium), 300 DPI (high)
- **Preview**: Preview before upload
- **Automatic upload**: Direct integration to library

### 📚 Document Library
- **PDF Upload**: Drag & drop or file selector
- **Description management**: Inline editing without reload
- **Secure tokens**: Unique UUID for each document
- **Statistics**: View counter per document
- **Operations**: Share, edit, delete

### 🔗 Multi-Channel Sharing
1. **Direct link**: Secure URL with quick copy
2. **QR Code**: Generate + download PNG for mobile access
3. **Iframe code**: Customizable (dimensions, fullscreen)
4. **Live preview**: Real-time iframe preview

### 🔐 Admin Interface
- **Authentication**: Secure password (Cloudflare Secrets)
- **3 Tabs**:
  - 📚 **Library**: Document management
  - 🔄 **Converter**: PDF processing A3→A5
  - 🔒 **Security**: Password change + AI Configuration
- **Inline editing**: Editable descriptions without modal
- **Modern interface**: TailwindCSS + dark theme

### 🤖 AI-Powered Analysis (v1.1.0 🆕)

**Automatic PDF metadata generation via Artificial Intelligence**

#### Features
- ✨ **Smart auto-completion**: Description, tags, folders generated automatically
- 🧠 **Gemini 2.5 Flash**: Ultra-fast analysis by Google AI (free up to 1500 req/day)
- 🔐 **Maximum security**: API keys encrypted with AES-256-GCM before storage
- ⚡ **Fast analysis**: Intelligent extraction + thumbnail in 5-7 seconds
- 🎯 **Contextual**: Adapts analysis to content (training, documentation, marketing)
- 🔍 **Integrated OCR**: Automatic text recognition for scanned PDFs via Tesseract.js (French + English)
- 📊 **Intelligent sampling**: Adaptive 1-3 page extraction based on document size (scalable to 1000+ pages)
- 💡 **API key indicator**: Visual badge showing if Gemini key is saved

#### "Analyze with AI" Button Locations

| Interface | Trigger | Pre-fills |
|-----------|---------|-----------|
| **📚 Direct Upload** | After file selection | Description, Tags, Folder |
| **🔄 Converter** | After PDF conversion | Description, Tags, Folder |
| **✏️ Edit Modal** | "🔄 Re-analyze" button | Filename, Description, Tags, Folder |

#### Configuration

1. **Go to Security > AI Configuration**
2. **Enable AI analysis** with the ON/OFF toggle
3. **Get a free Gemini key**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)
4. **Paste API key** and **Save**
5. **Check status badge**: ✅ Key saved / ⚠️ No key
6. **Test** with "Test API key" button

#### Estimated Costs

| Provider | Free | Paid | Cost/analysis |
|----------|------|------|---------------|
| **Gemini 2.5 Flash** | ✅ 1500 req/day | $0.075/1M tokens | ~$0.0001 |

**💡 Why Gemini 2.5 Flash?**
- ⚡ **3-4x faster** than Pro (5-7s vs 15-20s)
- 💰 **15x cheaper** than Pro ($0.0001 vs $0.0015)
- 🎯 **Excellent quality** for classification and tagging
- 🔒 **Zero thinking tokens**: No MAX_TOKENS overflow
- 📈 **Scalable**: Handles 1-1000+ pages via intelligent sampling

#### API Key Security

```
┌─────────────────────┐
│ Interface Input     │ (HTTPS)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Backend Encryption  │ (AES-256-GCM)
│ Key = PBKDF2(admin) │ (100k iterations)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│ Cloudflare KV       │ (Encrypted storage)
│ never in plaintext  │
└─────────────────────┘
```

**Guarantees**:
- ✅ Keys **never stored in plaintext**
- ✅ **Military-grade** encryption (AES-256-GCM)
- ✅ Key derived from **admin password** (PBKDF2)
- ✅ **Impossible to read back** after saving
- ✅ **Password change** → new encryption key

#### Analysis Workflow

```
1. User uploads PDF → Click "Analyze with AI"
2. Intelligent Sampling → Adaptive strategy based on size
   • ≤5 pages  : All pages analyzed
   • 6-20 pages: First 3 pages
   • 21-50 pages: First 2 pages
   • 50+ pages : First page only
3. Extraction (PDF.js) → Sampled text + Thumbnail
   ↓ If text < 100 characters (scanned PDF detected)
   3b. OCR (Tesseract.js) → Text extraction from images (1-3 pages based on size)
4. Secure transmission → Backend decrypts API key from KV
5. AI call → Gemini 2.5 Flash analyzes content
6. JSON parsing → { filename, description, tags, folder }
7. Pre-fill → User validates or modifies
8. Save → Metadata stored in D1
```

#### Example AI Suggestions

**Analyzed PDF**: Banking insurance training module 1

```json
{
  "filename": "banking-insurance-training-module-1.pdf",
  "description": "Introduction to life insurance and provident products in bancassurance",
  "tags": ["Training", "Bancassurance", "Life Insurance", "IDD"],
  "folder": "Training/Bancassurance"
}
```

---

## 🏗️ Technical Architecture

### Technology Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Hono v4 (Cloudflare Workers) |
| **Frontend** | Vanilla JS + TailwindCSS v3 |
| **Viewer** | StPageFlip v2.0.7 + PDF.js v3.11 |
| **Converter** | pdf-lib v1.17 (client-side) |
| **QR Codes** | QRCode.js v1.0 |

### Cloudflare Infrastructure

```
┌─────────────────────────────────────────────┐
│          Cloudflare Pages                    │
│  (Edge Hosting + Workers Runtime)           │
├─────────────────────────────────────────────┤
│  Hono Backend (src/index.tsx)               │
│  ├─ /api/admin/login                        │
│  ├─ /api/admin/upload                       │
│  ├─ /api/admin/documents                    │
│  ├─ /api/admin/change-password              │
│  ├─ /api/admin/set-ai-config         🆕    │
│  ├─ /api/admin/ai-config             🆕    │
│  ├─ /api/admin/test-ai                🆕    │
│  ├─ /api/admin/analyze-pdf           🆕    │
│  └─ /api/documents/:token                   │
├─────────────────────────────────────────────┤
│  Storage Services                            │
│  ├─ D1 Database (Distributed SQLite)        │
│  │  └─ Table: documents                     │
│  ├─ R2 Storage (S3-compatible)              │
│  │  └─ Bucket: storybook-pdfs               │
│  └─ KV Namespace (Key-Value)                │
│     ├─ admin_password_hash                  │
│     ├─ AI_ENABLED                    🆕    │
│     └─ GEMINI_API_KEY_ENCRYPTED     🆕    │
└─────────────────────────────────────────────┘
```

### Database Schema (D1)

```sql
CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  token TEXT UNIQUE NOT NULL,           -- UUID v4
  filename TEXT NOT NULL,
  description TEXT,
  r2_key TEXT NOT NULL,                 -- R2 Storage key
  size INTEGER NOT NULL,                -- Size in bytes
  views INTEGER DEFAULT 0,              -- View counter
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Security

| Mechanism | Implementation |
|-----------|----------------|
| **Admin authentication** | Dual password (custom KV + master secret) |
| **Hashing** | SHA-256 + 32 hex salt (Web Crypto API) |
| **Document tokens** | UUID v4 (impossible to enumerate) |
| **CORS** | Configured for controlled API access |
| **Secrets** | Cloudflare Secrets (encrypted) + KV |
| **Public access** | Read-only via tokens |

---

## 🚀 Installation & Deployment

### Prerequisites

- Node.js 18+ & npm
- Cloudflare account (free)
- Wrangler CLI: `npm install -g wrangler`

### Local Installation

```bash
# 1. Clone repository
git clone https://github.com/Atalantis/training-storybook.git
cd training-storybook

# 2. Install dependencies
npm install

# 3. Local configuration
echo "ADMIN_PASSWORD=YourPassword123" > .dev.vars

# 4. Local database migrations
npm run db:migrate:local

# 5. Build
npm run build

# 6. Start locally (PM2)
pm2 start ecosystem.config.cjs

# 7. Access
# → http://localhost:3000
```

### Production Deployment (Cloudflare Pages)

```bash
# 1. Cloudflare authentication
wrangler login

# 2. Create Cloudflare resources
# R2 Bucket
wrangler r2 bucket create storybook-pdfs

# D1 Database
wrangler d1 create storybook-library
# → Copy database_id to wrangler.jsonc

# KV Namespace
wrangler kv:namespace create DOCUMENTS
# → Copy id to wrangler.jsonc

# 3. Create Pages project
wrangler pages project create training-storybook --production-branch main

# 4. Production database migrations
wrangler d1 migrations apply storybook-library --remote

# 5. Configure admin password
# Via Cloudflare Dashboard:
# Workers & Pages → training-storybook → Settings → Environment variables
# Add: ADMIN_PASSWORD (encrypted) = YourPassword123

# 6. Build and deploy
npm run build
wrangler pages deploy dist --project-name training-storybook

# 7. Access production
# → https://training-storybook.pages.dev
```

### Environment Variables

**Local (`.dev.vars`)** :
```env
ADMIN_PASSWORD=YourSecurePassword123
```

**Production**: Configure via Cloudflare Dashboard (encrypted)

---

## 📱 Responsive Design

### Desktop (> 768px)
```
┌─────────────────────────────────────────────┐
│  Header (horizontal)                         │
├────────────────────────────┬────────────────┤
│                            │                 │
│   Double Page View         │   Thumbnails   │
│   (PageFlip Effect)        │   Panel        │
│                            │                 │
└────────────────────────────┴────────────────┘
```

### Mobile (< 768px)
```
┌───────────────────────┐
│  Header (vertical)    │
├───────────────────────┤
│                       │
│   Single Page View    │
│   (Optimized)         │
│                       │
├───────────────────────┤
│  Thumbnails           │
│  (Bottom Sheet)       │
└───────────────────────┘
```

**Mobile features**:
- ✅ Swipe left/right (navigation)
- ✅ Pinch-to-zoom
- ✅ 44x44px touch buttons (accessibility)
- ✅ iOS/Android compatible fullscreen

---

## 🎓 Educational Use Cases

### 1. In-Person Training
**Objective**: Quick distribution of materials to trainees in classroom

**Workflow**:
1. Upload storybook PDF via converter
2. Generate QR Code
3. Project QR on screen
4. Scan by trainees → Instant mobile access
5. Autonomous consultation on smartphones

**Benefits**:
- ⚡ Zero app installation
- 📱 Compatible with all devices
- 🔒 Secure access via token
- 📊 Consultation tracking

### 2. E-Learning & LMS
**Objective**: Integration into educational platforms (Moodle, Claroline, etc.)

**Workflow**:
1. Upload storybook
2. Copy iframe code
3. Integration into e-learning module
4. Configure dimensions (responsive)
5. Publish

**Example code**:
```html
<div class="storybook-container">
  <iframe 
    src="https://your-domain.pages.dev/view?doc=TOKEN" 
    width="100%" 
    height="800" 
    frameborder="0" 
    allowfullscreen 
    style="border: 1px solid #ddd; border-radius: 8px;">
  </iframe>
</div>
```

### 3. Email & Communication
**Objective**: Sending enriched educational content

**Workflow**:
1. Upload storybook
2. Copy secure direct link
3. Integration in email (HTML or text)
4. Send to learners
5. Direct access via click

**Email template**:
```html
Hello,

Your new training material is available:
🔗 <a href="https://your-domain.pages.dev/view?doc=TOKEN">
   Access storybook
</a>

Happy reading!
```

### 4. Standalone Presentations
**Objective**: Kiosks, interactive terminals, events

**Configuration**:
- Fullscreen mode by default
- Optimized touch navigation
- Optional autoplay
- Custom branding

---

## 🛠️ Maintenance

### Useful Commands

```bash
# Database
npm run db:migrate:local      # Local migrations (SQLite)
npm run db:migrate:prod       # Production migrations (D1)
npm run db:console:local      # Local D1 console
npm run db:console:prod       # Remote D1 console

# Development
npm run dev                   # Vite dev server
npm run build                 # Production build
pm2 logs webapp --nostream    # PM2 logs

# Deployment
npm run deploy                # Deploy Cloudflare Pages
npm run deploy:prod           # Explicit production deploy

# Security
npm run git:status            # Git status
npm run git:commit "message"  # Quick commit
```

### Monitoring

**Available metrics**:
- 📊 View counter per document
- 📁 Total R2 storage size
- 🕐 Last consultation date
- 📈 Access trends (via Cloudflare logs)

**Cloudflare Logs**:
```bash
# Real-time logs
wrangler pages deployment tail

# Production logs
# → Cloudflare Dashboard → Analytics
```

---

## 📂 Project Structure

```
training-storybook/
├── src/
│   └── index.tsx                 # Hono backend + API routes
├── public/
│   └── static/
│       ├── admin.js              # Admin interface (tabs)
│       ├── viewer.js             # PageFlip reader
│       └── viewer.css            # Viewer styles
├── migrations/
│   └── 0001_create_documents.sql # D1 schema
├── .git/                         # Git repository
├── .gitignore                    # Ignored files
├── .dev.vars                     # Local variables (git-ignored)
├── wrangler.jsonc                # Cloudflare config
├── package.json                  # Dependencies
├── ecosystem.config.cjs          # PM2 config
├── README.md                     # French documentation
├── README.en.md                  # English documentation
├── SECURITY_GUIDE.md             # Security guide
├── FIRST_LOGIN.md                # First login guide
└── CREDENTIALS.txt               # Credentials (git-ignored)
```

---

## 🆘 Troubleshooting

### Common Issues

#### 1. "Invalid password" in production
**Cause**: `ADMIN_PASSWORD` variable not configured on Cloudflare  
**Solution**: Dashboard → Settings → Environment variables → Add `ADMIN_PASSWORD` (encrypted)

#### 2. Iframe not displaying
**Cause**: CORS or X-Frame-Options  
**Solution**: Verify iframe URL is correct and `allowfullscreen` is present

#### 3. PDF not loading in viewer
**Cause**: Invalid token or deleted document  
**Solution**: Check token in D1 database: `wrangler d1 execute storybook-library --command="SELECT * FROM documents WHERE token='...'" --remote`

#### 4. A3→A5 converter fails
**Cause**: Protected PDF or non-standard format  
**Solution**: Use unprotected PDF and verify it's A3 landscape

---

## 📄 License

**Owner**: INSURACTIO  
**Usage**: Internal and INSURACTIO clients  
**Redistribution**: Not authorized without written agreement

### Third-Party Libraries

This project uses open-source libraries under permissive licenses (MIT, Apache 2.0):

- **StPageFlip v2.0.7** (MIT) - PageFlip effect by Nodlik
- **PDF.js v3.11.174** (Apache 2.0) - Mozilla Foundation
- **pdf-lib v1.17.1** (MIT) - Andrew Dillon
- **QRCode.js v1.0.0** (MIT) - David Shim
- **Hono v4** (MIT) - Yusuke Wada
- **TailwindCSS v3** (MIT) - Tailwind Labs

See [THIRD_PARTY_LICENSES.md](THIRD_PARTY_LICENSES.md) for complete license texts.

---

## 👤 Author

**Florent Siegenthaler** (INSURACTIO)  
- 💼 Senior Product Owner (7 years experience)
- 🏦 Insurance & Fintech Specialist
- 🎯 Discovery → Design → Delivery
- 🏢 INSURACTIO Founder
- 📧 Contact: [florent@insuractio.com](mailto:florent@insuractio.com)
- 🔗 LinkedIn: [/in/fsiegenthaler](https://www.linkedin.com/in/fsiegenthaler/)

---

## 💚 Support the Project

### Why Donate?

Storybook Reader is an **open source educational project** developed voluntarily to:
- 🎓 **Democratize access** to interactive presentation tools
- 🆓 **Offer a free alternative** to proprietary solutions (Gemini, etc.)
- 🌍 **Share knowledge** with the edtech community
- 🔓 **Make public** professional-quality tools

### Make a Donation

If this project is useful to you, you can support its development and the creation of new educational tools:

[![Donate via Lydia](https://img.shields.io/badge/💚_Donate_Now-Lydia-00D66F?style=for-the-badge)](https://pots.lydia.me/collect/pots?id=54317-storybook-reader)

**🔗 Direct link**: [https://pots.lydia.me/collect/pots?id=54317-storybook-reader](https://pots.lydia.me/collect/pots?id=54317-storybook-reader)

### Impact of Your Donation

Your contributions help to:
- ⚡ **Accelerate development** of new features
- 📚 **Create more** open source educational tools
- 🐛 **Maintain and improve** existing projects
- 📖 **Produce quality** documentation
- 🎓 **Train the community** via tutorials and examples

### Other Ways to Contribute

Can't afford to donate? You can also:
- ⭐ **Star the project** on GitHub (visibility++)
- 🐦 **Share** on LinkedIn/Twitter
- 📝 **Write an article** about your usage
- 🎤 **Present** the project in your organization
- 🤝 **Contribute code** (see section below)

---

## 🤝 Code Contributions

This project is open to community contributions:

1. 🐛 **Bug reports**: Open an issue on GitHub
2. 💡 **Suggestions**: Propose improvements via discussions
3. 🔧 **Pull requests**: Code contributions welcome (after discussion)
4. 📧 **Contact**: florent@insuractio.com

---

## 🔗 Useful Links

- 🌐 **Production**: [training-storybook.pages.dev](https://training-storybook.pages.dev)
- 📁 **GitHub**: [Atalantis/training-storybook](https://github.com/Atalantis/training-storybook)
- 📚 **Cloudflare Documentation**: [developers.cloudflare.com/pages](https://developers.cloudflare.com/pages)
- 🤖 **Gemini Storybook**: [gemini.google.com/gem/storybook](https://gemini.google.com/gem/storybook)

---

## 📊 Project Stats

- **Version**: 1.1.0
- **Date**: November 2025
- **Status**: ✅ Production Ready
- **Lines of code**: ~3500
- **Technologies**: 12
- **Cloudflare Services**: 4 (Pages, Workers, R2, D1)

---

**Developed with ❤️ by INSURACTIO to revolutionize banking and insurance training**
