# Changelog - Training Storybook

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Complete security audit and repository cleanup
- Git history cleanup - removed sensitive files from all commits
- Open Graph metadata for LinkedIn sharing (og:image, article:author, article:published_time)
- Public demo route `/demo` for demonstration without authentication
- Mobile detection with warning screen for admin interface
- Custom domains: `storybook.insuractio.com` and `reader.insuractio.com`

### Changed
- Improved OG image quality (1024x538px, optimized)
- Updated documentation with security best practices
- Smart routing: mobile → Flutter reader, desktop → StPageFlip viewer

### Security
- Removed `wrangler.jsonc` from git history (contained Cloudflare IDs)
- Created `wrangler.example.jsonc` template for users
- Enhanced .gitignore patterns
- Added comprehensive security documentation

---

## [1.5.0] - 2024-11-13

### Added
- Smart routing system: QR codes → mobile reader with standalone mode
- Separate mobile and desktop URLs in share modal
- Backend security verification for document access

### Changed
- Dramatically improved viewer quality for all PDFs
- Enhanced rendering quality for small/low-resolution PDFs
- Improved closed book cover quality with 2.5x render scale
- Boosted render quality with DPR (Device Pixel Ratio) support

### Fixed
- Mobile reader URL updated to production Cloudflare Pages
- QR code now correctly points to mobile reader with standalone parameter
- Correct mobile app routing with security checks

---

## [1.4.3] - 2024-11-12

### Added
- Client filter dropdown in documents list
- Filter by client combined with search, folder, and tags
- Auto-populated client list from documents

### Changed
- Improved filtering UX with multi-criteria support
- Reset button now clears all filters at once

---

## [1.4.2] - 2024-11-12

### Added
- Option to skip automatic compression on upload
- Checkbox "Ignorer la compression automatique" in upload form
- Preserve original file quality when needed

### Changed
- Compression now optional (default: compress files > 10 MB)
- Clear messaging when compression is skipped

### Fixed
- Double compression issues with externally optimized PDFs
- Quality degradation from repeated compression

---

## [1.4.1] - 2024-11-12

### Fixed
- **CRITICAL**: Dramatically improved image quality across all PDF operations
- Fixed blurry text and images in viewer
- Enhanced compression quality settings
- Improved render scale for better clarity

---

## [1.4.0] - 2024-11-12

### Added
- Significantly improved batch AI analysis quality
- Smart multi-page sampling for scanned PDFs
- Simulated progress bar during AI analysis
- Results modal with apply/skip options

### Changed
- AI analysis now samples beginning + end pages for better accuracy
- Enhanced prompt engineering for better metadata extraction

### Fixed
- InvalidPDFException error using correct /api/documents endpoint
- Batch analysis button re-enabling after completion
- Correct nested suggestions structure for PATCH requests

---

## [1.3.1] - 2024-11-11

### Fixed
- **CRITICAL**: Escaped quotes in onclick handlers to prevent syntax errors
- Improved AI prompt for accurate metadata extraction
- Enhanced error handling in AI analysis

---

## [1.3.0] - 2024-11-11

### Added
- First official publication release
- Initial commit with complete PDF library management
- Basic viewer functionality
- Upload and organization features

---

## [1.2.0] - 2024-11-10

### Added
- Bulk document management (select multiple documents)
- Shift+Click range selection
- Bulk edit tags, folder, and client
- Bulk delete with confirmation
- PDF converter with file replacement
- Document conversion between formats

### Changed
- Enhanced UI for bulk operations
- Improved tags parsing robustness (string and array formats)

### Fixed
- Bulk actions API calls and null element errors
- Double-stringify issue in bulk edit tags
- Duplicate 'bar' variable declaration
- Enhanced parseTags() robustness

---

## [1.1.0] - 2024-11-09

### Added
- Complete PDF library management system
- Document upload with metadata
- Folder organization
- Tag system
- Search functionality
- AI-powered document analysis with Gemini
- Automatic compression before upload
- Comprehensive debug logging

### Changed
- Improved performance for large libraries
- Enhanced UI/UX for document management

---

## [1.0.0] - 2024-11-08

### Added
- Initial release
- PDF viewer with StPageFlip integration
- Basic upload functionality
- Admin authentication
- Cloudflare Workers/Pages deployment
- R2 storage for PDFs
- D1 database for metadata
- KV namespace for caching

---

## Version History Summary

| Version | Date | Key Features |
|---------|------|--------------|
| Unreleased | 2024-11-14 | Security audit, OG metadata, demo route |
| 1.5.0 | 2024-11-13 | Smart routing, viewer quality improvements |
| 1.4.3 | 2024-11-12 | Client filter dropdown |
| 1.4.2 | 2024-11-12 | Skip compression option |
| 1.4.1 | 2024-11-12 | Image quality fixes |
| 1.4.0 | 2024-11-12 | Batch AI analysis improvements |
| 1.3.1 | 2024-11-11 | Critical bug fixes |
| 1.3.0 | 2024-11-11 | First official publication |
| 1.2.0 | 2024-11-10 | Bulk management & conversion |
| 1.1.0 | 2024-11-09 | Complete PDF library |
| 1.0.0 | 2024-11-08 | Initial release |

---

## Links

- **Repository**: https://github.com/Atalantis/training-storybook
- **Production**: https://storybook.insuractio.com
- **Mobile Reader**: https://reader.insuractio.com
- **Demo**: https://storybook.insuractio.com/demo
- **Issues**: https://github.com/Atalantis/training-storybook/issues

---

## Legend

- `Added` - New features
- `Changed` - Changes in existing functionality
- `Deprecated` - Soon-to-be removed features
- `Removed` - Removed features
- `Fixed` - Bug fixes
- `Security` - Security improvements
