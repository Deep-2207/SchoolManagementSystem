Add-Type -AssemblyName System.Speech
$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoiceByHints([System.Speech.Synthesis.VoiceGender]::Female)
$synth.Rate = 0
$synth.SetOutputToWaveFile("test_voice.wav")
$synth.Speak("Welcome to Lucifer Academy. Today we present the Scholastic Aptitude and Examination Platform.")
$synth.Dispose()
Write-Output "Voice file created: $(Test-Path test_voice.wav)"
