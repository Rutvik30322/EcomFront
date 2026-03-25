# PowerShell script to build and prepare React app for IIS deployment
# Run this script from the admin panel directory

Write-Host "Building React Admin Panel for IIS..." -ForegroundColor Green

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Build the application
Write-Host "Running production build..." -ForegroundColor Yellow
npm run build

# Check if build was successful
if (Test-Path "dist") {
    Write-Host "Build successful! Files are in the 'dist' folder." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "1. Copy ALL contents from the 'dist' folder to your IIS website directory" -ForegroundColor White
    Write-Host "2. Ensure web.config is included in the deployment" -ForegroundColor White
    Write-Host "3. Set proper folder permissions in IIS" -ForegroundColor White
    Write-Host "4. Verify URL Rewrite Module is installed on IIS" -ForegroundColor White
    Write-Host ""
    Write-Host "See IIS_DEPLOYMENT_GUIDE.md for detailed instructions." -ForegroundColor Yellow
    
    # Optionally open the dist folder
    $openFolder = Read-Host "Open dist folder? (Y/N)"
    if ($openFolder -eq "Y" -or $openFolder -eq "y") {
        explorer.exe dist
    }
} else {
    Write-Host "Build failed! Please check the error messages above." -ForegroundColor Red
    exit 1
}
