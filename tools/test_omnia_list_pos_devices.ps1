$asm = [System.Reflection.Assembly]::LoadWithPartialName('Microsoft.PointOfService')
if (-not $asm) {
	$fallback = Join-Path $env:ProgramFiles 'Microsoft POS for .NET\Microsoft.PointOfService.dll'
	if (Test-Path $fallback) {
		$asm = [System.Reflection.Assembly]::LoadFrom($fallback)
	} else {
		throw "Microsoft.PointOfService assembly not found (neither in GAC nor at $fallback)."
	}
}


$pos=New-Object Microsoft.PointOfService.PosExplorer; $pos.GetDevices() | Select-Object ServiceObjectName, DeviceName, DevicePath, Type


$e=New-Object Microsoft.PointOfService.PosExplorer; $d=$e.GetDevice("PosPrinter","PosPrinter"); 
if($d){$p=$e.CreateInstance($d); $p.Open(); $p.Claim(1000); $p.DeviceEnabled=$true; 
    $p|Get-Member -MemberType Property|%{$n=$_.Name;try{$v=$p.$n}catch{$v="<Error>"};"$n : $v"}; $p.DeviceEnabled=$false; $p.Release(); 
    $p.Close()}else{"No POS printer found with logical name 'PosPrinter2'."}