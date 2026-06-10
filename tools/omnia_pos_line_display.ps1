<#
.SYNOPSIS
    Shows a text string on a POS LineDisplay using the Microsoft.PointOfService API.

.DESCRIPTION
    The script expects a **single argument** that is a *URL‑encoded* JSON object
    in the following shape:

        {"textToDisplay":"This is what I want to display"}

    It loads the POS‑for‑.NET assembly, looks for a LineDisplay device,
    writes the requested text (character set 858, normal text mode) and
    finally returns a **JSON result object** instead of writing to the
    console or throwing terminating errors.

    The JSON result contains three fields:

        {
            "isSuccessWithoutError": <bool>,
            "isMissingLineDisplay" : <bool>,
            "errorMessage"         : <string|null>
        }

    * `isSuccessWithoutError` – true only when the text was actually shown.
    * `isMissingLineDisplay`  – true when no LineDisplay device was found.
    * `errorMessage`          – populated only when an error occurs.

.EXAMPLE
    # Encode the JSON payload (PowerShell example):
    $payload = '{"textToDisplay":"Hello world"}'
    $enc    = [System.Net.WebUtility]::UrlEncode($payload)
    .\Show-On-LineDisplay.ps1 $enc
#>

[CmdletBinding()]
param(
    # The argument is a *single* URL‑encoded JSON string.
    [Parameter(Mandatory=$true, Position=0)]
    [string]$EncodedJson
)

# -------------------------------------------------------------------------
# Helper – build the JSON result object and exit the script
function Write-Result {
    param(
        [bool]   $Success,
        [bool]   $Missing,
        [string] $Message = $null
    )
    $result = [ordered]@{
        isSuccessWithoutError = $Success
        isMissingLineDisplay  = $Missing
        errorMessage          = if ($null -eq $Message) { $null } else { $Message }
    }

    # Output a **single** JSON object (compact form)
    $result | ConvertTo-Json -Compress
    exit 0
}

# -------------------------------------------------------------------------
# 1️⃣  Decode the incoming argument and extract the text
try {
    $jsonString = [System.Net.WebUtility]::UrlDecode($EncodedJson)
    $payload    = $jsonString | ConvertFrom-Json -ErrorAction Stop
    $textToShow = $payload.textToDisplay
}
catch {
    Write-Result -Success:$false -Missing:$false -Message:"Failed to decode/parse input JSON – $_"
}

if ([string]::IsNullOrWhiteSpace($textToShow)) {
    Write-Result -Success:$false -Missing:$false -Message:"Input JSON does not contain a non‑empty 'textToDisplay' property."
}

# -------------------------------------------------------------------------
# 2️⃣  Load Microsoft.PointOfService assembly (POS for .NET)
try {
    $posAsm = [System.Reflection.Assembly]::LoadWithPartialName('Microsoft.PointOfService')
    if (-not $posAsm) {
        $fallback = Join-Path $env:ProgramFiles 'Microsoft POS for .NET\Microsoft.PointOfService.dll'
        if (Test-Path $fallback) {
            $posAsm = [System.Reflection.Assembly]::LoadFrom($fallback)
        } else {
            throw "Assembly not found in GAC or in $fallback"
        }
    }
}
catch {
    Write-Result -Success:$false -Missing:$false -Message:"Unable to load Microsoft.PointOfService assembly – $_"
}

# -------------------------------------------------------------------------
# 3️⃣  Discover a LineDisplay device
try {
    $explorer = New-Object Microsoft.PointOfService.PosExplorer
}
catch {
    Write-Result -Success:$false -Missing:$false -Message:"Failed to create PosExplorer – $_"
}

$lineDisplays = $explorer.GetDevices([Microsoft.PointOfService.DeviceType]::LineDisplay)

if ($lineDisplays.Count -eq 0) {
    # No device present – per requirements we report this case.
    Write-Result -Success:$false -Missing:$true -Message:$null
}

# -------------------------------------------------------------------------
# 4️⃣  Use the first device that was found
$devInfo = $lineDisplays[0]

try {
    $display = $explorer.CreateInstance($devInfo)
}
catch {
    Write-Result -Success:$false -Missing:$false -Message:"Failed to create LineDisplay instance – $_"
}

# -------------------------------------------------------------------------
# 5️⃣  Open / claim / enable the device
try {
    $display.Open()
    $display.Claim(1000)          # 1 second timeout
    $display.DeviceEnabled = $true
}
catch {
    Write-Result -Success:$false -Missing:$false -Message:"Could not open/claim the LineDisplay – $_"
}

# -------------------------------------------------------------------------
# 6️⃣  Set charset (858) and text mode (Normal)
try {
    $display.CharacterSet = [Microsoft.PointOfService.LineDisplayCharacterSet]::CS858
    $display.DefaultWindow.TextMode = [Microsoft.PointOfService.DisplayTextMode]::Normal
}
catch {
    # Clean‑up before exiting
    try { $display.Release() } catch {}
    try { $display.Close()   } catch {}
    Write-Result -Success:$false -Missing:$false -Message:"Failed to configure charset/text mode – $_"
}

# -------------------------------------------------------------------------
# 7️⃣  Write the supplied text
try {
    $display.DefaultWindow.DisplayText($textToShow)
}
catch {
    try { $display.Release() } catch {}
    try { $display.Close()   } catch {}
    Write-Result -Success:$false -Missing:$false -Message:"Unable to write text to the LineDisplay – $_"
}
finally {
    # Always release / close the device
    try { $display.Release() } catch {}
    try { $display.Close()   } catch {}
}

# -------------------------------------------------------------------------
# 8️⃣  Everything succeeded
Write-Result -Success:$true -Missing:$false -Message:$null
