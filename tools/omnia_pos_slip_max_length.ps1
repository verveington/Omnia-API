<#=====================================================================
  Expected argument (URL‑encoded JSON)

  {
      "printerName":"PosPrinter2"
  }

  Example (PowerShell):
  $json = [uri]::EscapeDataString('{"printerName":"PosPrinter2"}')
  .\omnia_pos_slip_max_length.ps1 -EncodedJson $json
=====================================================================#>

[CmdletBinding()]
param (
# -----------------------------------------------------------------
  [Parameter(Mandatory=$true,
    HelpMessage = "URL‑encoded JSON with printerName")]
  [string]$EncodedJson
)

# -----------------------------------------------------------------
# Helper: write the JSON result that the caller expects and exit
function Write-Result {
  param(
    [bool]$Success,
    [string]$Message = $null,
    [string]$Response = $null
  )
  $result = @{ isSuccessWithoutError = $Success }
  if (-not $Success) { $result.errorMessage = $Message }
  $result.response = $Response
  $result | ConvertTo-Json -Depth 3
  exit
}

# -----------------------------------------------------------------
# 1️⃣  Decode the incoming JSON and validate the fields
try {
  $decoded = [uri]::UnescapeDataString($EncodedJson)
  $payload = $decoded | ConvertFrom-Json -ErrorAction Stop
}
catch {
  Write-Result -Success:$false -Message "Failed to decode/parse JSON: $($_.Exception.Message)"
}

# Required properties
if (-not $payload.printerName) {
  Write-Result -Success:$false -Message "JSON is missing required property 'printerName'."
}

$printerName   = $payload.printerName

$asm = [System.Reflection.Assembly]::LoadWithPartialName('Microsoft.PointOfService')
if (-not $asm) {
	$fallback = Join-Path $env:ProgramFiles 'Microsoft POS for .NET\Microsoft.PointOfService.dll'
	if (Test-Path $fallback) {
		$asm = [System.Reflection.Assembly]::LoadFrom($fallback)
	} else {
		throw "Microsoft.PointOfService assembly not found (neither in GAC nor at $fallback)."
	}
}


# -----------------------------------------------------------------
# Global variables used during cleanup
$printer = $null
$device  = $null
$claimed = $false
$opened  = $false
$maxChars = $false

# -----------------------------------------------------------------
# Cleanup routine – always called before exiting
function Cleanup {
  if ($null -ne $printer) {
    try { if ($printer.DeviceEnabled) { $printer.DeviceEnabled = $false } } catch {}
    if ($claimed) { try { $printer.Release() } catch {} }
    if ($opened)  { try { $printer.Close() } catch {} }
    try { $printer.Dispose() } catch {}
  }
  if ($null -ne $device) {
    try { $device.Dispose() } catch {}
  }
}

# -----------------------------------------------------------------
# 3️⃣  Initialise the slip printer (open, claim, set properties)
function Init-Device {
  param([string]$Name)


  $device  = New-Object Microsoft.PointOfService.PosExplorer

  $printerClss = $device.GetDevice('PosPrinter', $Name)  

#Write-Host $printerClss

$printer = $device.CreateInstance($printerClss)

  if ($null -eq $printer) {
    throw "Printer named '$Name' could not be found in the POS for .NET registry."
  }

  $printer.Open()
  $opened = $true

   # $printer.Claim(1000)   # timeout 2000 ms # "Die arithmetische Operation hat einen Überlauf verursacht.\" - PosPrinter2 - im vorletzten Teil
  #$claimed = $true


  # Set the required properties
  # $printer.DeviceEnabled    = $true
}

# -----------------------------------------------------------------
# MAIN ---------------------------------------------------------------
try {
  # ----- Initialise ------------------------------------------------
  Init-Device -Name $printerName

$rawValue = $printer.SlpLineChars
$maxChars = if ($null -eq $rawValue) { if ("TM-H5000II" -eq $printer.DeviceName) {66} else {56} } else { $rawValue }

  Write-Result -Success:$true -Response $maxChars
}
catch {
  # Any unexpected exception lands here – guarantee cleanup
  Cleanup
  Write-Result -Success:$false -Message "$($_.Exception.Message) - $($printerName) - im vorletzten Teil"
} finally {
  # Ensure cleanup even if something strange happens outside try/catch
  Cleanup
}
