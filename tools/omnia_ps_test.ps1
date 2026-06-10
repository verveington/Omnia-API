<#
.SYNOPSIS
    Takes a URL‑encoded JSON argument, extracts a “name” property and returns
    a fixed‑shape JSON response.

.PARAMETER UrlEncodedJson
    A single string that is a URL‑encoded JSON object, e.g.
    "%7B%22name%22%3A%22my%20name%22%7D"

.EXAMPLE
    # From a regular PS console (just to test)
    .\handle-json.ps1 '%7B%22name%22%3A%22Alice%22%7D'
#>

[CmdletBinding()]
param(
  [Parameter(Mandatory=$true, Position=0)]
  [string]$UrlEncodedJson
)

# -------------------------------------------------------------------------
# Helper: safely write a JSON object to stdout (no extra PowerShell formatting)
function Write-Result($obj) {
  $json = $obj | ConvertTo-Json -Depth 5 -Compress
  # Write‑output writes a *string* followed by a newline.  That's fine – the
  # Node side will `trim()` the result.
  Write-Output $json
}
# -------------------------------------------------------------------------

try {
  # 1️⃣ Decode the URL‑encoded text
  Add-Type -AssemblyName System.Web   # loads System.Web.HttpUtility
  $decoded = [System.Web.HttpUtility]::UrlDecode($UrlEncodedJson)

  # 2️⃣ Parse the JSON payload
  $payload = $decoded | ConvertFrom-Json -ErrorAction Stop

  # 3️⃣ Validate that the expected property exists
  if (-not $payload.PSObject.Properties.Name -contains 'name') {
    throw "Property 'name' not found in payload."
  }

  # 4️⃣ Business logic – in this simple example we just greet the name
  $greeting = "Hello, $($payload.name)!"

  # 5️⃣ Build the response object (all keys are **lower‑camelCase** as you wrote)
  $result = [PSCustomObject]@{
    isSuccessWithoutError = $true
    isMissingLineDisplay  = $false   # you can change the logic if needed
    errorMessage          = $null
    response              = $greeting
  }

  Write-Result $result
}
catch {
  # Something went wrong – return a failure object
  $errMsg = $_.Exception.Message

  $failure = [PSCustomObject]@{
    isSuccessWithoutError = $false
    isMissingLineDisplay  = $false   # still false unless you have a reason to set true
    errorMessage          = $errMsg
    response              = $null
  }

  Write-Result $failure
}
