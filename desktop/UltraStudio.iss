; Per-user installation. User data, managed services and models live outside {app}.
[Setup]
AppId={{2C7A899E-B52D-4201-A8D1-0BC9A4FBE024}
AppName=Ultra Studio
AppVersion=0.1.0
AppPublisher=Ultra Studio
DefaultDirName={localappdata}\Programs\UltraStudio
DefaultGroupName=Ultra Studio
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
OutputDir=dist\installer
OutputBaseFilename=UltraStudio-Setup
Compression=lzma2
SolidCompression=yes
WizardStyle=modern
CloseApplications=yes
SetupLogging=yes
UninstallDisplayIcon={app}\UltraStudio.exe

[Files]
Source: "dist\UltraStudio\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs
Source: "build\MicrosoftEdgeWebview2Setup.exe"; DestDir: "{tmp}"; Flags: deleteafterinstall

[Icons]
Name: "{group}\Ultra Studio"; Filename: "{app}\UltraStudio.exe"
Name: "{group}\Ultra Studio setup and repair"; Filename: "{app}\UltraStudio.exe"; Parameters: "--setup"
Name: "{autodesktop}\Ultra Studio"; Filename: "{app}\UltraStudio.exe"; Tasks: desktopicon

[Tasks]
Name: "desktopicon"; Description: "Create a desktop shortcut"; Flags: unchecked

[Run]
Filename: "{tmp}\MicrosoftEdgeWebview2Setup.exe"; Parameters: "/silent /install"; StatusMsg: "Installing Microsoft WebView2…"; Flags: waituntilterminated; Check: NeedsWebView2
Filename: "{app}\UltraStudio.exe"; Description: "Open Ultra Studio and configure ComfyUI"; Flags: nowait postinstall skipifsilent

[Code]
function ValidRuntime(RootKey: Integer; Key: String): Boolean;
var Version: String;
begin
  Result := RegQueryStringValue(RootKey, Key, 'pv', Version) and (Version <> '') and (Version <> '0.0.0.0');
end;

function NeedsWebView2: Boolean;
begin
  Result := not (ValidRuntime(HKCU, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}') or
                 ValidRuntime(HKLM32, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}') or
                 ValidRuntime(HKLM64, 'Software\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}'));
end;
