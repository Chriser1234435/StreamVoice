$ErrorActionPreference = 'Stop'
Set-Location 'C:\StreamVoice'
$logPath = 'C:\StreamVoiceData\api.log'
& 'C:\Program Files\nodejs\npm.cmd' run api *>> $logPath
