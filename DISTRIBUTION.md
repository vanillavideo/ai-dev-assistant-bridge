# Distribution Guide

This guide explains how to package and distribute the AI Dev Assistant Bridge extension to other users.

## Quick Distribution (Share with Anyone)

### 1. Package the Extension

```bash
# Ensure you're on latest code
git pull

# Install dependencies (if needed)
npm install

# Compile and package
npm run compile
npx @vscode/vsce package
```

This creates `ai-dev-assistant-bridge-0.9.4.vsix` in the project root.

### 2. Share the VSIX File

**Option A: Direct File Sharing**
- Send the `.vsix` file via email, Slack, or file sharing service
- Recipients install via: Extensions view → `...` menu → "Install from VSIX..."

**Option B: GitHub Release**
1. Create a new release on GitHub
2. Upload `.vsix` as release asset
3. Share release URL

**Option C: Internal Network**
- Host `.vsix` on company intranet/sharepoint
- Users download and install locally

### 3. User Installation

Users can install the `.vsix` file in two ways:

**Via VS Code UI:**
1. Open Extensions view (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Click `...` menu (top right)
3. Select "Install from VSIX..."
4. Choose the downloaded `.vsix` file

**Via Command Line:**
```bash
code --install-extension ai-dev-assistant-bridge-0.9.4.vsix
```

## Publishing to VS Code Marketplace

For wider distribution, publish to the official marketplace:

### Prerequisites

1. **Create Publisher Account**
   - Visit https://marketplace.visualstudio.com/manage
   - Sign in with Microsoft/GitHub account
   - Create a publisher ID (e.g., "your-company")

2. **Get Personal Access Token**
   - Go to Azure DevOps: https://dev.azure.com
   - User Settings → Personal Access Tokens
   - Create new token with **Marketplace → Manage** scope
   - Save token securely (you won't see it again)

### Update Package Metadata

Edit `package.json`:

```json
{
  "publisher": "your-publisher-id",  // Change from "local"
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/ai-dev-assistant-bridge.git"
  },
  "bugs": {
    "url": "https://github.com/your-username/ai-dev-assistant-bridge/issues"
  },
  "homepage": "https://github.com/your-username/ai-dev-assistant-bridge#readme"
}
```

### Publish

```bash
# Login (one-time)
npx @vscode/vsce login your-publisher-id
# Enter your Personal Access Token when prompted

# Publish current version
npx @vscode/vsce publish

# Or publish with version bump
npx @vscode/vsce publish patch  # 0.9.4 → 0.9.5
npx @vscode/vsce publish minor  # 0.9.4 → 0.10.0
npx @vscode/vsce publish major  # 0.9.4 → 1.0.0
```

### Post-Publication

- Extension appears at: `https://marketplace.visualstudio.com/items?itemName=your-publisher-id.ai-dev-assistant-bridge`
- Users can install via: Extensions search → "AI Dev Assistant Bridge"
- Updates publish automatically (users notified in VS Code)

## Enterprise Distribution

### Method 1: Extensions Gallery (Recommended)

Host a private extension gallery:

1. Set up internal gallery server
2. Configure VS Code settings:
   ```json
   {
     "extensions.gallery": {
       "serviceUrl": "https://your-company.com/gallery/api",
       "itemUrl": "https://your-company.com/gallery/items"
     }
   }
   ```
3. Upload `.vsix` to internal gallery

### Method 2: Workspace Recommendations

Add to `.vscode/extensions.json` in project repositories:

```json
{
  "recommendations": [
    "local.ai-dev-assistant-bridge"
  ]
}
```

Users see "Install Recommended Extensions" prompt when opening workspace.

### Method 3: Policy Deployment

Deploy via Group Policy or MDM:

```powershell
# Windows PowerShell script
$vsixPath = "\\fileserver\extensions\ai-dev-assistant-bridge-0.9.4.vsix"
code --install-extension $vsixPath
```

```bash
# Linux/Mac deployment script
VSIX_URL="https://internal-server.com/extensions/ai-dev-assistant-bridge-0.9.4.vsix"
curl -O $VSIX_URL
code --install-extension ai-dev-assistant-bridge-0.9.4.vsix
```

### Method 4: Settings Sync

Configure organization settings sync to include extension automatically.

## Version Management

### Semantic Versioning

Follow semver: `MAJOR.MINOR.PATCH`

- **MAJOR**: Breaking changes (e.g., API changes)
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

### Release Process

1. **Update Version**
   ```bash
   # Edit package.json version
   npm install  # Updates package-lock.json
   git add package.json package-lock.json
   git commit -m "chore: bump version to X.Y.Z"
   git tag vX.Y.Z
   git push && git push --tags
   ```

2. **Create Changelog**
   - Document changes in CHANGELOG.md
   - Include breaking changes, new features, bug fixes
   - Reference issue/PR numbers

3. **Package and Test**
   ```bash
   npm run compile
   npm test  # Run tests
   npx @vscode/vsce package
   # Install and test locally
   code --install-extension ai-dev-assistant-bridge-X.Y.Z.vsix
   ```

4. **Distribute**
   - Upload to GitHub Releases
   - Publish to marketplace (if applicable)
   - Update internal documentation

## Troubleshooting

### VSIX Not Installing

**Error: "Extension is not compatible"**
- Check VS Code engine version in `package.json`
- Ensure user has compatible VS Code version

**Error: "Extension already installed"**
- Uninstall existing version first
- Or use `code --force --install-extension` flag

### Marketplace Publishing Issues

**Error: "Personal Access Token expired"**
- Generate new token in Azure DevOps
- Re-authenticate: `npx @vscode/vsce login`

**Error: "Publisher not found"**
- Create publisher at marketplace.visualstudio.com/manage
- Update `publisher` field in package.json

### Package Size Warnings

If package exceeds 50MB:
- Review included files: `npx @vscode/vsce ls`
- Add exclusions to `.vscodeignore`
- Remove unnecessary dependencies

## Best Practices

1. **Test Before Distribution**
   - Install locally and test all features
   - Check different VS Code versions
   - Verify on Windows, Mac, and Linux

2. **Include Documentation**
   - Keep README.md comprehensive and up-to-date
   - Provide usage examples
   - Document breaking changes

3. **Security**
   - Never include secrets in `.vsix`
   - Review all included files
   - Keep dependencies updated

4. **Communication**
   - Announce new releases to users
   - Provide migration guides for breaking changes
   - Maintain changelog

## Support Resources

- **VS Code Publishing Docs**: https://code.visualstudio.com/api/working-with-extensions/publishing-extension
- **vsce CLI Reference**: https://github.com/microsoft/vscode-vsce
- **Marketplace Management**: https://marketplace.visualstudio.com/manage
- **Extension Guidelines**: https://code.visualstudio.com/api/references/extension-guidelines

---

For questions or issues, see README.md support section.
