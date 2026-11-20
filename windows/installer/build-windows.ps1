#Requires -Version 7.0
param(
    [string]$Configuration = "Release",
    [string]$Runtime = "win-x64",
    [bool]$BuildMsi = $true
)

$ErrorActionPreference = "Stop"

$publishDir = Join-Path $PSScriptRoot "publish"
$outDir = Join-Path $PSScriptRoot "out"

if (Test-Path $publishDir) { Remove-Item -Recurse -Force $publishDir }
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

Write-Host "Running BRIDGE Windows unit tests..."
dotnet test ..\Bridge.Tests\Bridge.Tests.csproj -c $Configuration

Write-Host "Publishing BRIDGE for Windows ($Configuration | $Runtime)..."
dotnet publish ..\Bridge.Desktop\Bridge.Desktop.csproj `
    -c $Configuration `
    -r $Runtime `
    --self-contained true `
    -p:Platform=x64 `
    -p:WindowsPackageType=None `
    -o $publishDir

if ($BuildMsi) {
    $msiPath = Join-Path $outDir "Bridge-Windows-Setup.msi"
    Write-Host "Building WiX v4 MSI installer at $msiPath..."
    wix build (Join-Path $PSScriptRoot "Package.wxs") -d "PublishDir=$publishDir" -arch x64 -o $msiPath
    Write-Host "MSI installer built successfully: $msiPath"
}
