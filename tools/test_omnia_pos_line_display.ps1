$payload = '{"textToDisplay":"Hello world"}'
$enc    = [System.Net.WebUtility]::UrlEncode($payload)
.\omnia_pos_line_display.ps1 $enc
