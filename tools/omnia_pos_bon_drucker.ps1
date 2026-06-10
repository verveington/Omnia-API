<#
.SYNOPSIS
    Prints a receipt on a POS printer (Microsoft.PointOfService.PosPrinter).

.DESCRIPTION
    The script receives **one argument** – a *URL‑encoded* JSON string that may
    contain the following fields (all optional):

        {
            "printerName"       : "PosPrinter2",          # optional logical name as in APOS
            "logo"              : "<base64‑encoded JPG>",
            "druckinhalt"       : "Free‑form text",
            "barcode"           : "1234567890",
            "barcodeSymbology"  : "Code128",
            "qrcode"            : "<base64‑encoded bitmap>"
        }

    Items are printed in the exact order shown above.

    The script never writes to the console and never throws terminating
    errors.  It always returns **one JSON object** with three properties:

        {
            "isSuccessWithoutError" : <bool>,
            "isMissingDevice"       : <bool>,
            "errorMessage"          : <string|null>
        }

    * `isSuccessWithoutError` – **true** only when everything printed OK.
    * `isMissingDevice`       – **true** when the POS for .NET runtime is not
      installed **or** when no printer (or the named printer) could be found.
    * `errorMessage`          – populated when an unexpected error occurs.

.NOTES
    • The script first checks that the *Microsoft.PointOfService* assembly
      (POS for .NET) is installed.
    • If *printerName* is supplied the script tries to open that logical
      printer; otherwise the first printer returned by the explorer is used.

#>

[CmdletBinding()]
param(
    # URL‑encoded JSON payload (see description)
    [Parameter(Mandatory=$true, Position=0)]
    [string]$EncodedPayload
)

# -------------------------------------------------
# Helper – emit the JSON result and exit the script
function Write-Result {
    param(
        [bool] $Success,
        [bool] $MissingDevice,
        [string] $Message = $null
    )
    $obj = [ordered]@{
        isSuccessWithoutError = $Success
        isMissingDevice       = $MissingDevice
        errorMessage          = if ($null -eq $Message) { $null } else { $Message }
    }
    $obj | ConvertTo-Json -Compress
    exit 0
}

# -------------------------------------------------
# 1️⃣ Decode the incoming argument
try {
    $jsonString = [System.Net.WebUtility]::UrlDecode($EncodedPayload)
    $data       = $jsonString | ConvertFrom-Json -ErrorAction Stop
}
catch {
    Write-Result -Success:$false -MissingDevice:$false `
                 -Message:"Failed to decode/parse input JSON – $_"
}

# -------------------------------------------------
# 2️⃣ Verify POS‑for‑.NET installation (Microsoft.PointOfService assembly)
try {
    $posAsm = [System.Reflection.Assembly]::LoadWithPartialName('Microsoft.PointOfService')
    if (-not $posAsm) {
        $fallback = Join-Path $env:ProgramFiles `
                   'Microsoft POS for .NET\Microsoft.PointOfService.dll'
        if (Test-Path $fallback) {
            $posAsm = [System.Reflection.Assembly]::LoadFrom($fallback)
        }
        else {
            throw "Assembly not found in GAC nor at $fallback"
        }
    }
}
catch {
    # No POS runtime ⇒ device is effectively missing
    Write-Result -Success:$false -MissingDevice:$true `
                 -Message:"Microsoft.PointOfService assembly could not be loaded – $_"
}

# -------------------------------------------------
# 3️⃣ Create a PosExplorer
try {
    $explorer = New-Object Microsoft.PointOfService.PosExplorer
}
catch {
    Write-Result -Success:$false -MissingDevice:$false `
                 -Message:"Unable to create PosExplorer – $_"
}

# -------------------------------------------------
# 4️⃣ Locate the printer
$printerInfo = $null

# If a logical name was supplied, try to fetch that exact device
if ($data.printerName) {
    try {
        $printerInfo = $explorer.GetDevice(
            [Microsoft.PointOfService.DeviceType]::PosPrinter,
            $data.printerName)
    }
    catch {
        # Swallow – will be handled as "not found" below
    }
}

# If we still have nothing, fall back to the first discovered printer
if (-not $printerInfo) {
    $printers = $explorer.GetDevices(
        [Microsoft.PointOfService.DeviceType]::PosPrinter)

    if ($printers.Count -eq 0) {
        Write-Result -Success:$false -MissingDevice:$true `
                     -Message:"No PosPrinter device found."
    }
    $printerInfo = $printers[0]
}

# -------------------------------------------------
# 5️⃣ Instantiate the printer object
try {
    $printer = $explorer.CreateInstance($printerInfo)
}
catch {
    Write-Result -Success:$false -MissingDevice:$false `
                 -Message:"Failed to instantiate PosPrinter – $_"
}

# -------------------------------------------------
# 6️⃣ Open / claim / enable the printer
try {
    $printer.Open()
    $printer.Claim(2000)          # 2‑second timeout
    $printer.DeviceEnabled = $true
}
catch {
    Write-Result -Success:$false -MissingDevice:$false `
                 -Message:"Could not open/claim the PosPrinter – $_"
}

# -------------------------------------------------
# Helper – always release/close before exiting
function Release-Printer {
    if ($null -ne $printer) {
        try { $printer.Release() } catch {}
        try { $printer.Close()   } catch {}
    }
}

# -------------------------------------------------
# 7️⃣ Print the optional parts (order matters)

# ---- 7.1 logo (base64 JPG) -------------------------------------------
if ($data.logo) {
    try {
        $logoBytes = [Convert]::FromBase64String($data.logo)
        $lineWidth = $printer.RecLineWidth
        $printer.PrintMemoryBitmap(
            [Microsoft.PointOfService.DataPrinterStation]::Receipt,
            $logoBytes,
            $lineWidth,
            [Microsoft.PointOfService.PosPrinter+PrinterBitmapCenter]::Center)
    }
    catch {
        Release-Printer
        Write-Result -Success:$false -MissingDevice:$false `
                     -Message:"Failed to print logo – $_"
    }
}

# ---- 7.2 druckinhalt (plain text) ------------------------------------
if ($data.druckinhalt) {
    try {
        $printer.PrintNormal(
            [Microsoft.PointOfService.DataPrinterStation]::Receipt,
            $data.druckinhalt)
    }
    catch {
        Release-Printer
        Write-Result -Success:$false -MissingDevice:$false `
                     -Message:"Failed to print druckinhalt – $_"
    }
}

# ---- 7.3 barcode -------------------------------------------------------
if ($data.barcode) {
    # Map the supplied string to the PosPrinter.PrinterBarcodeSymbology enum
    $symMap = @{
        "Code39"   = [Microsoft.PointOfService.PosPrinter+PrinterBarcodeSymbology]::Code39
        "Code128"  = [Microsoft.PointOfService.PosPrinter+PrinterBarcodeSymbology]::Code128
        "UPC_A"    = [Microsoft.PointOfService.PosPrinter+PrinterBarcodeSymbology]::UPC_A
        "EAN13"    = [Microsoft.PointOfService.PosPrinter+PrinterBarcodeSymbology]::EAN13
        "PDF417"   = [Microsoft.PointOfService.PosPrinter+PrinterBarcodeSymbology]::PDF417
        # extend as needed
    }

    $sym = $symMap[$data.barcodeSymbology]
    if (-not $sym) {
        $sym = [Microsoft.PointOfService.PosPrinter+PrinterBarcodeSymbology]::Code39   # default
    }

    try {
        $printer.PrintBarCode(
            [Microsoft.PointOfService.DataPrinterStation]::Receipt,
            $data.barcode,
            $sym,
            100,    # height (dots)
            2,      # width (module width)
            [Microsoft.PointOfService.PosPrinter+PrinterBarcodeTextPosition]::Below)
    }
    catch {
        Release-Printer
        Write-Result -Success:$false -MissingDevice:$false `
                     -Message:"Failed to print barcode – $_"
    }
}

# ---- 7.4 qrcode (base64 bitmap) ---------------------------------------
if ($data.qrcode) {
    try {
        $qrBytes = [Convert]::FromBase64String($data.qrcode)
        $lineWidth = $printer.RecLineWidth
        $printer.PrintMemoryBitmap(
            [Microsoft.PointOfService.DataPrinterStation]::Receipt,
            $qrBytes,
            $lineWidth,
            [Microsoft.PointOfService.PosPrinter+PrinterBitmapCenter]::Center)

        # newline after QR code
        $printer.PrintNormal(
            [Microsoft.PointOfService.DataPrinterStation]::Receipt,
            "`r`n")
    }
    catch {
        Release-Printer
        Write-Result -Success:$false -MissingDevice:$false `
                     -Message:"Failed to print QR code – $_"
    }
}

# ---- 7.5 final ESC/POS form‑feed command -------------------------------
try {
    # "\u001b|fP" is the ESC/POS command that sends a form feed / cut
    $printer.PrintNormal(
        [Microsoft.PointOfService.DataPrinterStation]::Receipt,
        "`u001b|fP")
}
catch {
    Release-Printer
    Write-Result -Success:$false -MissingDevice:$false `
                 -Message:"Failed to send final form‑feed command – $_"
}

# -------------------------------------------------
# 8️⃣ Clean‑up and report success
Release-Printer
Write-Result -Success:$true -MissingDevice:$false -Message:$null
