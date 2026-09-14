$ErrorActionPreference = 'Stop'
$repo = 'C:\Users\dan\Desktop\RESEARCH 1,0\research\Alcubierre drive\casimirbot.com\versions\CasimirBot (9-3-25)\CasimirBot (9-3-25)\CasimirBot'
Set-Location -LiteralPath $repo
$env:JAVA_HOME = 'C:\Users\dan\.gradle\jdks\eclipse_adoptium-21-amd64-windows.2'
$env:HELIX_NATIVE_COMPILED_HANDOFF = '1'
# This qualification uses the test's ephemeral isolated HTTP server only.
foreach ($name in @('HELIX_NATIVE_BROKER_FIXTURE_ORIGIN', 'HELIX_NATIVE_BROKER_CONTINUOUS_LOST_THIRD', 'HELIX_NATIVE_BROKER_CONTINUOUS_LOST_BATCH_ACK')) {
  Remove-Item -LiteralPath ('Env:' + $name) -ErrorAction SilentlyContinue
}
# Compiler fixture generation already passed and its exact files are retained.
& .\minecraft\helix-paper-sensor\gradlew.bat -p minecraft/helix-fabric-player-agent --no-daemon --max-workers=1 test --rerun --tests '*FluidSequenceEngineTest' --tests '*PlayerActionRuntimeTransportTest' --tests '*ResidentEffectMeasurementsTest' remapJar -x runGameTest *> .tmp/companion-focused-qualification-retry-20260914.log
if ($LASTEXITCODE -ne 0) { throw 'companion_focused_qualification_failed' }
Write-Output 'Companion focused qualification and remapJar exited zero. Sensor and input observations were simulated; this is not live acceptance.'
