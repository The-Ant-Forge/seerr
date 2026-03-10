Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "powershell -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & Replace(WScript.ScriptFullName, "Seerr-Tray.vbs", "Seerr-Tray.ps1") & """", 0, False
