# Script to upload project-index.txt to Google Cloud Storage
# Make sure you have Google Cloud SDK installed and authenticated

# Define variables
$SOURCE_FILE = "project-index.txt"
$DESTINATION = "gs://chopinbucket1/Chopin/project-index.txt"

# Check if file exists
if (-not (Test-Path $SOURCE_FILE)) {
    Write-Error "Error: $SOURCE_FILE does not exist!"
    exit 1
}

# Upload file to Google Cloud Storage
Write-Host "Uploading $SOURCE_FILE to $DESTINATION..."
try {
    gsutil cp $SOURCE_FILE $DESTINATION
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Upload successful!"
        Write-Host "File is now available at: $DESTINATION"
    } else {
        Write-Error "Upload failed with exit code $LASTEXITCODE"
    }
} catch {
    Write-Error "Error during upload: $_"
}
