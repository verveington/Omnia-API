<#=====================================================================
  Uses the Microsoft.PointOfService (POS for .NET) API to
  • Verify the POS DLL is present
  • Accept **one** argument – a *URL‑encoded* JSON string that contains
        printerName, printRotation and data
  • Open / claim a slip‑printer, wait for insertion, print, wait for removal
  • Clean‑up all POS resources on success *or* failure
  -------------------------------------------------
  Expected argument (URL‑encoded JSON)

  {
      "printerName":"TM-H5000II",
      "printRotation":"Normal",          # one of Normal, Rotated90, Rotated180, Rotated270
      "data":"Hello World`nSecond Line"
  }

=====================================================================#>

[CmdletBinding()]
param (
# -----------------------------------------------------------------
# The only required argument: a URL‑encoded JSON string that contains
#   printerName   : string
#   printRotation : string – name of PrintRotation enum value
#   data          : string – text to print (may contain \n, \r\n, etc.)
# -----------------------------------------------------------------
  [Parameter(Mandatory=$true,
    HelpMessage = "URL‑encoded JSON with printerName, printRotation and data")]
  [string]$EncodedJson
)

# -----------------------------------------------------------------
# Helper: write the JSON result that the caller expects and exit
function Write-Result {
  param(
    [bool]$Success,
    [string]$Message = $null
  )
  $result = @{ isSuccessWithoutError = $Success }
  if (-not $Success) { $result.errorMessage = $Message }
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
if (-not $payload.printRotation) {
  Write-Result -Success:$false -Message "JSON is missing required property 'printRotation'."
}
if (-not $payload.data) {
  Write-Result -Success:$false -Message "JSON is missing required property 'data'."
}

$printerName   = $payload.printerName
$printRotation = $payload.printRotation
$data          = $payload.data

# -----------------------------------------------------------------
# 2️⃣  Verify the Microsoft.PointOfService assembly is present
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
  $printer = $device.CreateInstance($printerClss)

  if ($null -eq $printer) {
    throw "Printer named '$Name' could not be found in the POS for .NET registry."
  }

  #Write-Host $printerClss

  $printer.Open()
  $opened = $true

  $printer.Claim(2000)   # timeout 2000 ms
  $claimed = $true

  # Set the required properties
  $printer.DeviceEnabled    = $true
  $printer.RecLetterQuality = $true
  $printer.MapMode          = [Microsoft.PointOfService.MapMode]::Metric
}

# -----------------------------------------------------------------
# 4️⃣  Wait for slip insertion (3000 ms timeout). If it fails, we abort.
function Wait-ForInsertion {
  $printer.BeginInsertion(3000) | Out-Null
  $printer.EndInsertion()        # Throws on timeout/failure
}

# -----------------------------------------------------------------
# 5️⃣  Print the supplied data with the requested rotation,
#     then reset rotation to Normal (step 5 of the original spec)
function Print-Data {
  param(
    [Microsoft.PointOfService.PrintRotation]$Rotation,
    [string]$Text
  )
  $printer.RotatePrint([Microsoft.PointOfService.PrinterStation]::Slip, $Rotation)
  $printer.PrintNormal([Microsoft.PointOfService.PrinterStation]::Slip, $Text)

  # Reset rotation as required
  $printer.RotatePrint([Microsoft.PointOfService.PrinterStation]::Slip,
    [Microsoft.PointOfService.PrintRotation]::Normal)
}

# -----------------------------------------------------------------
# 6️⃣  Wait for the slip to be removed (3000 ms timeout)
function Wait-ForRemoval {
  $printer.BeginRemoval(3000) | Out-Null
  $printer.EndRemoval()
}

# -----------------------------------------------------------------
# MAIN ---------------------------------------------------------------
try {
  # ----- Initialise ------------------------------------------------
  Init-Device -Name $printerName

  # ----- Slip insertion --------------------------------------------
  try {
    Wait-ForInsertion
  }
  catch {
    Cleanup
    Write-Result -Success:$false -Message "Slip insertion failed: $($_.Exception.Message)"
  }

  # ----- Convert rotation string to enum ---------------------------
  $rotEnum = try {
    [Microsoft.PointOfService.PrintRotation]::Parse($printRotation, $true)
  }
  catch {
    Cleanup
    Write-Result -Success:$false -Message "Invalid printRotation value '$printRotation'. Valid values: Normal, Rotated90, Rotated180, Rotated270."
  }

  # ----- Print ------------------------------------------------------
  Print-Data -Rotation $rotEnum -Text $data

  # ----- Slip removal -----------------------------------------------
  try {
    Wait-ForRemoval
  }
  catch {
    Cleanup
    Write-Result -Success:$false -Message "Slip removal failed: $($_.Exception.Message)"
  }

  # ----- Success ----------------------------------------------------
  Cleanup
  Write-Result -Success:$true
}
catch {
  # Any unexpected exception lands here – guarantee cleanup
  Cleanup
  Write-Result -Success:$false -Message $_.Exception.Message
}
finally {
  # Ensure cleanup even if something strange happens outside try/catch
  Cleanup
}
