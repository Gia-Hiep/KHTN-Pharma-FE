# ================================
# Setup React Project Structure
# ================================

Write-Host "Creating folder structure inside src..."

# Base path
$basePath = "src"

# List folders to create
$folders = @(
    "apis",
    "assets",
    "components",
    "constants",
    "types",
    "hooks",
    "layouts",
    "pages",
    "lib",
    "providers",
    "schemas",
    "stores",
    "styles",
    "utils"
)

# Create src if not exists
if (!(Test-Path $basePath)) {
    New-Item -ItemType Directory -Path $basePath
    Write-Host "Created src folder"
}

# Create subfolders
foreach ($folder in $folders) {
    $path = Join-Path $basePath $folder
    if (!(Test-Path $path)) {
        New-Item -ItemType Directory -Path $path
        Write-Host "Created $path"
    } else {
        Write-Host "$path already exists"
    }
}

# Create root files if not exist
$files = @(
    "App.tsx",
    "routes.tsx"
)

foreach ($file in $files) {
    $filePath = Join-Path $basePath $file
    if (!(Test-Path $filePath)) {
        New-Item -ItemType File -Path $filePath
        Write-Host "Created $filePath"
    } else {
        Write-Host "$filePath already exists"
    }
}

Write-Host "Project structure setup completed."