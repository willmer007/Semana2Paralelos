param(
  [int]$NUM_REQUESTS = 10,
  [int]$COMPLEXITY   = 1
)

$baseUrl = "http://localhost:5001/api/facturar"

Write-Host "`nIniciando prueba de carga con $NUM_REQUESTS requests (complejidad=$COMPLEXITY)...`n"

$jobs = @()
for ($i = 1; $i -le $NUM_REQUESTS; $i++) {
  # Preparamos el JSON del body
  $bodyObj = @{
    deviceId = "DEVICE_$i"
    payload  = @{ complexity = $COMPLEXITY }
  }
  $bodyJson = $bodyObj | ConvertTo-Json

  # Iniciamos un job que haga curl en background
  $jobs += Start-Job -ScriptBlock {
    param($url, $jsonBody)
    curl -s -X POST $url `
      -H "Content-Type: application/json" `
      -d $jsonBody
  } -ArgumentList $baseUrl, $bodyJson
}

# Esperamos a que todos los jobs terminen
$jobs | Wait-Job

Write-Host "`nResultados de cada petición:`n"
foreach ($j in $jobs) {
  Receive-Job $j | Write-Host
}

Write-Host "`nPrueba finalizada.`n"
