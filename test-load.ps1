param(
  [int]$NUM_REQUESTS = 10,
  [int]$COMPLEXITY   = 1
)

$baseUrl = "http://localhost:5001/api/facturar"
Write-Host "`nIniciando prueba de carga con $NUM_REQUESTS requests (complejidad=$COMPLEXITY)...`n"

$jobs = @()
for ($i = 1; $i -le $NUM_REQUESTS; $i++) {
  # Construimos el body en JSON
  $bodyObj = @{
    deviceId = "DEVICE_$i"
    payload  = @{ complexity = $COMPLEXITY }
  }
  $bodyJson = $bodyObj | ConvertTo-Json

  # En lugar de 'curl', llamamos explícitamente a 'curl.exe'
  $jobs += Start-Job -ScriptBlock {
    param($url, $jsonBody)
    curl.exe -s -X POST $url `
      -H "Content-Type: application/json" `
      -d $jsonBody
  } -ArgumentList $baseUrl, $bodyJson
}

# Esperamos a que todos los jobs terminen
$jobs | Wait-Job

Write-Host "`nResultados de cada peticion`n"
foreach ($j in $jobs) {
  Receive-Job $j | Write-Host
}

Write-Host "`nPrueba finalizada.`n"
