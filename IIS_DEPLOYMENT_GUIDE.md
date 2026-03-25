# IIS Deployment Guide for React Admin Panel

This guide will help you deploy your React admin panel to IIS (Internet Information Services) on Windows Server.

## Prerequisites

1. **IIS Installed** with the following features:
   - IIS Management Console
   - URL Rewrite Module (required for React Router)
   - Static Content
   - Default Document

2. **Node.js** installed on your development machine (for building the app)

## Step 1: Install URL Rewrite Module

The URL Rewrite Module is essential for React Router to work properly on IIS.

1. Download URL Rewrite Module from: https://www.iis.net/downloads/microsoft/url-rewrite
2. Install it on your IIS server
3. Restart IIS if prompted

## Step 2: Build the React Application

1. Navigate to the admin panel directory:
   ```bash
   cd "admin-panel/admin panel"
   ```

2. Install dependencies (if not already installed):
   ```bash
   npm install
   ```

3. Build the production version:
   ```bash
   npm run build
   ```

   This will create a `dist` folder with all the production-ready files.

## Step 3: Deploy to IIS

### Option A: Copy Files to IIS Directory

1. **Create a new website or application in IIS:**
   - Open IIS Manager
   - Right-click on "Sites" → "Add Website"
   - Set a site name (e.g., "AdminPanel")
   - Set the physical path to a folder (e.g., `C:\inetpub\wwwroot\admin-panel`)
   - Set the binding (port 80 or a specific port, hostname if needed)
   - Click OK

2. **Copy build files:**
   - Copy ALL contents from the `dist` folder to your IIS website directory
   - Make sure the `web.config` file is included in the root of the deployed folder

3. **Set Application Pool (IMPORTANT for React static site):**
   
   **Option A: Create a New Application Pool (Recommended)**
   - In IIS Manager, expand your server name
   - Right-click on "Application Pools" → "Add Application Pool..."
   - Name: Enter a name (e.g., "ReactAppPool" or "Chocolateappadminpanel")
   - .NET CLR version: Select "No Managed Code" (this is critical for static React sites)
   - Managed pipeline mode: Select "Integrated"
   - Click OK
   
   **Option B: Modify Existing Application Pool**
   - In IIS Manager, expand your server name
   - Click on "Application Pools"
   - Select your application pool (e.g., "Chocolateappadminpanel")
   - Click "Advanced Settings..." in the right panel
   - Find ".NET CLR Version" → Change from "v4.0" to "No Managed Code"
   - Find "Managed Pipeline Mode" → Ensure it's set to "Integrated"
   - Click OK
   
   **Assign the Application Pool to Your Website:**
   - Select your website in IIS Manager
   - Click "Basic Settings..." in the right panel
   - Click "Select..." next to Application Pool
   - Choose the application pool with "No Managed Code" (the one you just created or modified)
   - Click OK, then OK again
   
   **Why "No Managed Code"?**
   - React apps are static JavaScript files (HTML, CSS, JS)
   - They don't need .NET runtime to execute
   - Using "No Managed Code" reduces overhead and improves performance

### Option B: Use Existing Website

If you want to deploy to an existing website:

1. Create a new Application under your existing website:
   - Right-click on your website → "Add Application"
   - Set Alias (e.g., "admin")
   - Set Physical Path to your deployment folder
   - Click OK

2. Copy all files from `dist` folder to the application directory

## Step 4: Configure Permissions

1. **Set folder permissions:**
   - Right-click on the deployment folder → Properties → Security
   - Add "IIS_IUSRS" with "Read & Execute" and "Read" permissions
   - Add "IUSR" with "Read & Execute" and "Read" permissions

2. **Verify Application Pool Identity:**
   - In IIS Manager, go to Application Pools
   - Select your application pool → Advanced Settings
   - Ensure "Identity" is set appropriately (usually "ApplicationPoolIdentity")

## Step 5: Verify Configuration

1. **Check web.config is present:**
   - Ensure `web.config` is in the root of your deployment directory
   - It should be copied from the project root (already included)

2. **Test the application:**
   - Open a browser and navigate to your site URL
   - Try accessing different routes (e.g., `/dashboard`, `/products`)
   - All routes should work without 404 errors

## Step 6: Configure API Endpoints (if needed)

If your React app makes API calls to a backend:

1. **Update API base URL:**
   - Check `src/services/api.js` for API configuration
   - Ensure the API URL points to your backend server
   - You may need to rebuild after changing API URLs

2. **CORS Configuration:**
   - If your backend is on a different domain, ensure CORS is properly configured on your backend server

## Troubleshooting

### Issue: HTTP Error 500.19 - Internal Server Error (Config Error)

**Symptoms:**
- Error code: 0x8007000d
- Error message mentions `web.config` is invalid
- Config Error field may be empty

**Causes & Solutions:**

1. **URL Rewrite Module Not Installed (Most Common)**
   - The `web.config` file uses `<rewrite>` section which requires URL Rewrite Module
   - **Solution A (Recommended):** Install URL Rewrite Module
     - Download from: https://www.iis.net/downloads/microsoft/url-rewrite
     - Install and restart IIS
   - **Solution B (Quick Fix):** Use minimal web.config
     - Rename `web.config.minimal` to `web.config` (backup current one first)
     - This version works without URL Rewrite Module but has limited React Router support
     - Direct URL access to routes may show 404, but navigation within the app will work

2. **Invalid XML Syntax**
   - Check `web.config` for XML syntax errors
   - Ensure proper encoding (UTF-8)
   - Verify all tags are properly closed

3. **IIS Features Not Enabled**
   - Ensure "Static Content" is enabled in IIS Features
   - Go to: Control Panel → Programs → Turn Windows features on/off → IIS → World Wide Web Services → Common HTTP Features → Static Content

4. **File Permissions**
   - Ensure IIS_IUSRS has read access to `web.config`
   - Right-click `web.config` → Properties → Security → Add IIS_IUSRS with Read permission

### Issue: 404 errors on route navigation

**Solution:** 
- Verify URL Rewrite Module is installed
- Check that `web.config` is in the root directory
- If using `web.config.minimal`, consider installing URL Rewrite Module for full React Router support
- Restart IIS: `iisreset` in Command Prompt (as Administrator)

### Issue: Blank page or errors loading assets

**Solution:**
- Check browser console for 404 errors on assets
- Verify all files from `dist` folder were copied
- Check file permissions on the deployment folder
- Ensure MIME types are configured (should be handled by web.config)

### Issue: API calls failing

**Solution:**
- Check API URL configuration in your React app
- Verify backend server is running and accessible
- Check CORS settings on backend
- Review browser Network tab for specific error messages

### Issue: Styles not loading

**Solution:**
- Clear browser cache
- Verify CSS files are in the `assets` folder
- Check that all files were copied correctly

## Testing Checklist

- [ ] Application loads at root URL
- [ ] Login page is accessible
- [ ] After login, dashboard loads correctly
- [ ] Navigation between pages works
- [ ] Direct URL access to routes works (e.g., `/products`)
- [ ] API calls are successful
- [ ] Assets (images, CSS, JS) load correctly
- [ ] No console errors in browser

## Maintenance

### Updating the Application

1. Make changes to your React code
2. Run `npm run build` again
3. Copy new files from `dist` folder to IIS directory (overwrite existing files)
4. Clear browser cache or do a hard refresh (Ctrl+F5)

### Logs

- IIS logs are typically located at: `C:\inetpub\logs\LogFiles\`
- Check Application Event Viewer for IIS-related errors

## Additional Configuration

### HTTPS Setup (Recommended)

1. Install SSL certificate in IIS
2. Add HTTPS binding to your website
3. Optionally redirect HTTP to HTTPS

### Performance Optimization

- Enable static content compression in IIS
- Configure browser caching headers
- Consider using a CDN for static assets

## Support

If you encounter issues:
1. Check IIS logs
2. Check browser console for errors
3. Verify all prerequisites are installed
4. Ensure file permissions are correct
