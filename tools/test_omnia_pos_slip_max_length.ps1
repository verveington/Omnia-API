$json = [uri]::EscapeDataString('{"printerName":"PosPrinter2"}')
.\omnia_pos_slip_max_length.ps1 -EncodedJson $json
