# 🔍 TORI Ingestion Concept Diagnostic Script

$loopDir = "C:\Users\jason\Desktop\tori\kha\logs\loopRecord"
$files = Get-ChildItem -Path $loopDir -Filter *.json -File -Recurse

if (-not $files) {
    Write-Warning "No .json logs found in $loopDir"
    exit
}

$report = @()

foreach ($file in $files) {
    try {
        $json = Get-Content $file.FullName -Raw | ConvertFrom-Json
    } catch {
        Write-Warning "❌ Failed to parse $($file.Name)"
        continue
    }

    $doc = [PSCustomObject]@{
        FileName             = $file.Name
        Source               = $json.source_file
        Timestamp            = $json.timestamp
        TotalConcepts        = ($json.concepts | Measure-Object).Count
        SemanticConcepts     = ($json.semantic_concepts | Measure-Object).Count
        MinConfidence        = ($json.semantic_concepts | Select-Object -ExpandProperty confidence | Measure-Object -Minimum).Minimum
        MaxConfidence        = ($json.semantic_concepts | Select-Object -ExpandProperty confidence | Measure-Object -Maximum).Maximum
        AvgConfidence        = ($json.semantic_concepts | Select-Object -ExpandProperty confidence | Measure-Object -Average).Average
        Notes                = if ($json.semantic_concepts.Count -lt 4) { "⚠️ Low concept yield" } else { "✅" }
    }

    $report += $doc
}

# Print report
$report | Sort-Object Timestamp | Format-Table -AutoSize
