$types = Add-Type -AssemblyName UIAutomationClientsideProviders -PassThru
$assembly = $types[0].Assembly
@{ assembly = $assembly.FullName; types = @($assembly.GetExportedTypes() | ForEach-Object { @{ name=$_.FullName; fields=@($_.GetFields() | ForEach-Object Name); properties=@($_.GetProperties() | ForEach-Object Name) } }) } | ConvertTo-Json -Depth 5 -Compress
