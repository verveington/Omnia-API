<#
.SYNOPSIS
    Opens a POS cash‑drawer by using the Microsoft.PointOfService.CashDrawer class.

.DESCRIPTION
    The script does **not** write anything to the console or throw terminating errors.
    It always returns a single JSON object (compact format) with the following
    properties:

        {
            "isSuccessWithoutError": <bool>,
            "errorMessage"         : <string|null>
        }

    * `isSuccessWithoutError` – `$true` only when the drawer was opened successfully.
    * `errorMessage`          – populated when something goes wrong (assembly not
      found, no cash‑drawer device present, failure to claim/open, etc.).

    No input arguments are required – the script simply attempts to open the
    first cash‑drawer it can find.

.EXAMPLE
    .\Open‑CashDrawer.ps1

    # possible output
    {"isSuccessWithoutError":true,"errorMessage":null}
#>

[CmdletBinding()]
param()

# -------------------------------------------------------------------------
# Helper – emit the JSON result and exit the script
function Write-Result {
    param(
        [bool]   $Success,
        [string] $Message = $null
    )
    $result = [ordered]@{
        isSuccessWithoutError = $Success
        errorMessage          = if ($null -eq $Message) { $null } else { $Message }
    }

    $result | ConvertTo-Json -Compress
    exit 0
}

# -------------------------------------------------------------------------
# 1️⃣ Load the POS‑for‑.NET assembly (Microsoft.PointOfService)
try {
    $asm = [System.Reflection.Assembly]::LoadWithPartialName('Microsoft.PointOfService')
    if (-not $asm) {
        $fallback = Join-Path $env:ProgramFiles 'Microsoft POS for .NET\Microsoft.PointOfService.dll'
        if (Test-Path $fallback) {
            $asm = [System.Reflection.Assembly]::LoadFrom($fallback)
        } else {
            throw "Microsoft.PointOfService assembly not found (neither in GAC nor at $fallback)."
        }
    }
}
catch {
    Write-Result -Success:$false -Message:"Failed to load Microsoft.PointOfService assembly"
}
#try {
#    $asm = [System.Reflection.Assembly]::LoadWithPartialName('Epson.opos')
#    if (-not $asm) {
#        $fallback = Join-Path $env:ProgramFiles 'epson\OPOS for .NET\Epson.opos.tm.service.dll'
#        if (Test-Path $fallback) {
#            $asm = [System.Reflection.Assembly]::LoadFrom($fallback)
#        } else {
#            throw "Microsoft.PointOfService assembly not found (neither in GAC nor at $fallback)."
#        }
#    }
#}
#catch {
#    Write-Result -Success:$false -Message:"Failed to load Microsoft.PointOfService assembly"
#}



# -------------------------------------------------------------------------
# 2️⃣ Create a PosExplorer and look for a CashDrawer device
try {
    $explorer = New-Object Microsoft.PointOfService.PosExplorer

   # # Logical name from Epson SetupPOS
   # $logicalName = "CashDrawer1"
#
   # # Open the device
   # $rc = $drawer.Open($logicalName)
   # if ($rc -ne 0) { throw "Open failed with code $rc" }
#
   # # Claim the device (timeout in ms)
   # $rc = $drawer.ClaimDevice(1000)
   # if ($rc -ne 0) { throw "ClaimDevice failed with code $rc" }
#
   # # Enable the device
   # $drawer.DeviceEnabled = $true
#
   # # Open the drawer
   # $drawer.OpenDrawer()
   # Write-Host "Cash drawer opened successfully."
#
   # # Optional: Wait until closed
   # while (-not $drawer.DrawerClosed) {
   #     Start-Sleep -Milliseconds 200
   # }
#
   # # Release and close
   # $drawer.ReleaseDevice()
   # $drawer.Close()
}
catch {
    Write-Result -Success:$false -Message:"Unable to create device: $($_.Exception.Message)"
}

$cashDrawers = $explorer.GetDevices([Microsoft.PointOfService.DeviceType]::CashDrawer)

if ($cashDrawers.Count -eq 0) {
    Write-Result -Success:$false -Message:"No CashDrawer device found."
}

# -------------------------------------------------------------------------
# 3️⃣ Use the first discovered cash‑drawer
$devInfo = $cashDrawers[0]

try {
    $drawer = $explorer.CreateInstance($devInfo)
}
catch {
    Write-Result -Success:$false -Message:"Failed to instantiate CashDrawer"
}

# -------------------------------------------------------------------------
# 5️⃣ Open the drawer
try {
    $drawer.Open()
    # BUGGED ON EPSON TM: $drawer.Claim([int]1000)          # 1‑second timeout
    $drawer.DeviceEnabled = $true
    $drawer.OpenDrawer()

    # -------------------------------------------------------------------------
    # 6️⃣ Everything succeeded
    Write-Result -Success:$true -Message:$null
}
catch {
    Write-Result -Success:$false -Message:"Failed to open the cash drawer: $($_.Exception.Message)"
}
finally {
    # Clean‑up before exiting
    # Always release / close the device
    try {
         $drawer.DeviceEnabled = $false 
    } catch {}
    try { $drawer.Release() } catch {}
    try { $drawer.Close()   } catch {}
}

