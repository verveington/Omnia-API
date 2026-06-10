# 1️⃣  Build the JSON payload
$payload = @{
  printerName   = "PosPrinter"
  printRotation = "Normal"          # Normal, Rotated90, Rotated180, Rotated270
  data          = "Hello World`nSecond Line"
} | ConvertTo-Json -Compress

# 2️⃣  URL‑encode it (required because the script expects a single URL‑encoded argument)
$encoded = [uri]::EscapeDataString($payload)

# 3️⃣  Call the script
.\omnia_pos_rezept_taxierung.ps1 -EncodedJson $encoded
