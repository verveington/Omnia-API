
$payload = @{
  printerName       = "PosPrinter2"
  logo              = [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\optica_direkt\logo.jpg'))
  druckinhalt       = "Thank you for shopping!"
  barcode           = "123456789012"
  barcodeSymbology  = "Code128"
  qrcode            = [Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\optica_direkt\qr.png'))
} | ConvertTo-Json -Compress

$enc = [System.Net.WebUtility]::UrlEncode($payload)
.\omnia_pos_bon_drucker.ps1 $enc
