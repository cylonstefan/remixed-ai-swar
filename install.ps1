# ==============================================================================
#                  AI SWARM OS v3.2 - WINDOWS ADVANCED GUI INSTALLER
# ==============================================================================
# Autor: CYLON Central Intelligence
# Srodowisko: PowerShell z silnikiem WPF (Windows Presentation Foundation)
# Zoptymalizowano pod katem: Windows 11 oraz Docker Desktop
# NOWOSCI: MDM, Vision AI Analyzer, Chronos Scheduler
# ==============================================================================

# Debug log start
"--------------------------------------------------" | Out-File "install_debug.log" -Append -Encoding utf8
(Get-Date).ToString() + " Instalator v3.2 wystartował" | Out-File "install_debug.log" -Append -Encoding utf8

# Wymuszenie kodowania UTF-8 dla ładnych polskich znaków w konsoli
$OutputEncoding = [System.Text.Encoding]::UTF8

# 1. Sprawdzenie uprawnien administratora i ewentualne podniesienie
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[UAC] Brak uprawnien Administratora. Uruchamianie monitu podniesienia uprawnien..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
    Exit
}

# Blokada niepodpisanych skryptow dla biezacej sesji
Set-ExecutionPolicy Bypass -Scope Process -Force

# Ladowanie zestawów WPF i Windows Forms
Add-Type -AssemblyName PresentationFramework, PresentationCore, WindowsBase, System.Drawing, System.Windows.Forms

# Definicja unikalnego stylu GUI (Ciemny motyw w stylu CYLON - Slate / Neon Cyan & Purple / Acid Green)
[xml]$xaml = @"
<Window 
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    Title="AI Swarm OS v3.2 - Instalator Cybernetyczny dla Windows i Docker" 
    Height="660" Width="510" 
    WindowStartupLocation="CenterScreen"
    Background="#0F172A" 
    ResizeMode="NoResize" 
    BorderThickness="1" 
    BorderBrush="#1E293B">
    
    <Grid Margin="20">
        <Grid.RowDefinitions>
            <RowDefinition Height="Auto"/> <!-- Header -->
            <RowDefinition Height="Auto"/> <!-- Status panel -->
            <RowDefinition Height="*"/>    <!-- Log terminal -->
            <RowDefinition Height="Auto"/> <!-- Progress Bar -->
            <RowDefinition Height="Auto"/> <!-- Action Buttons -->
        </Grid.RowDefinitions>

        <!-- Naglowek -->
        <StackPanel Grid.Row="0" Margin="0,0,0,15">
            <TextBlock Text="AI SWARM OS v3.2" FontSize="22" FontFamily="Consolas" FontWeight="Bold" Foreground="#06B6D4" HorizontalAlignment="Center"/>
            <TextBlock Text="WINDOWS 11 / ANDROID MDM / DOCKER MULTI-SETUP" FontSize="9" FontFamily="Consolas" Foreground="#A855F7" LetterSpacing="2" HorizontalAlignment="Center" Margin="0,2,0,0"/>
            <Border Height="1" Background="#1E293B" Margin="0,10,0,0"/>
        </StackPanel>

        <!-- Status Panel -->
        <Border Grid.Row="1" Background="#020617" BorderBrush="#334155" BorderThickness="1" CornerRadius="8" Padding="15" Margin="0,0,0,15">
            <Grid>
                <Grid.ColumnDefinitions>
                    <ColumnDefinition Width="2*"/>
                    <Grid.ColumnDefinition Width="1*"/>
                </Grid.ColumnDefinitions>
                <Grid.RowDefinitions>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                    <RowDefinition Height="Auto"/>
                </Grid.RowDefinitions>

                <TextBlock Grid.Row="0" Grid.Column="0" Text="Uprawnienia Administratora:" Foreground="#94A3B8" FontSize="11" Margin="0,2"/>
                <TextBlock x:Name="TxtAdminStatus" Grid.Row="0" Grid.Column="1" Text="AKTYWNE" Foreground="#10B981" FontWeight="Bold" FontSize="11" HorizontalAlignment="Right" Margin="0,2"/>

                <TextBlock Grid.Row="1" Grid.Column="0" Text="Node.js v22 (Recomm.):" Foreground="#94A3B8" FontSize="11" Margin="0,2"/>
                <TextBlock x:Name="TxtNodeStatus" Grid.Row="1" Grid.Column="1" Text="Sprawdzanie..." Foreground="#F59E0B" FontWeight="Bold" FontSize="11" HorizontalAlignment="Right" Margin="0,2"/>

                <TextBlock Grid.Row="2" Grid.Column="0" Text="Android ADB (MDM):" Foreground="#94A3B8" FontSize="11" Margin="0,2"/>
                <TextBlock x:Name="TxtGitStatus" Grid.Row="2" Grid.Column="1" Text="Sprawdzanie..." Foreground="#F59E0B" FontWeight="Bold" FontSize="11" HorizontalAlignment="Right" Margin="0,2"/>

                <TextBlock Grid.Row="3" Grid.Column="0" Text="Menedzer Docker:" Foreground="#94A3B8" FontSize="11" Margin="0,2"/>
                <TextBlock x:Name="TxtDockerStatus" Grid.Row="3" Grid.Column="1" Text="Sprawdzanie..." Foreground="#F59E0B" FontWeight="Bold" FontSize="11" HorizontalAlignment="Right" Margin="0,2"/>

                <TextBlock Grid.Row="4" Grid.Column="0" Text="Struktura Plikow:" Foreground="#94A3B8" FontSize="11" Margin="0,2"/>
                <TextBlock x:Name="TxtFilesStatus" Grid.Row="4" Grid.Column="1" Text="Oczekuje" Foreground="#64748B" FontWeight="Bold" FontSize="11" HorizontalAlignment="Right" Margin="0,2"/>
            </Grid>
        </Border>

        <!-- Systemowy Terminal Logowania -->
        <GroupBox Grid.Row="2" Header="LOG OPERACYJNY WINDOWS / DOCKER DESKTOP" Foreground="#64748B" FontFamily="Consolas" FontSize="10" BorderBrush="#1E293B" Margin="0,0,0,15">
            <TextBox x:Name="TxtTerminal" 
                     IsReadOnly="True" 
                     AcceptsReturn="True" 
                     VerticalScrollBarVisibility="Auto" 
                     Background="#020617" 
                     Foreground="#38BDF8" 
                     FontFamily="Consolas" 
                     FontSize="11" 
                     BorderThickness="0" 
                     Padding="8"
                     TextWrapping="Wrap"/>
        </GroupBox>

        <!-- Progress Bar -->
        <StackPanel Grid.Row="3" Margin="0,0,0,15">
            <Grid Margin="0,0,0,5">
                <TextBlock x:Name="TxtProgressPercent" Text="Wybierz metode instalacji ponizej..." Foreground="#38BDF8" FontSize="10" FontFamily="Consolas" HorizontalAlignment="Left"/>
                <TextBlock x:Name="TxtProgressStep" Text="0%" Foreground="#38BDF8" FontSize="10" FontFamily="Consolas" HorizontalAlignment="Right"/>
            </Grid>
            <ProgressBar x:Name="MainProgressBar" Height="14" Minimum="0" Maximum="100" Value="0" Background="#1E293B" Foreground="#06B6D4" BorderThickness="0"/>
        </StackPanel>

        <!-- Przyciski akcji -->
        <Grid Grid.Row="4">
            <Grid.ColumnDefinitions>
                <ColumnDefinition Width="1*"/>
                <ColumnDefinition Width="2*"/>
                <ColumnDefinition Width="2*"/>
            </Grid.ColumnDefinitions>
            <Button x:Name="BtnCancel" Grid.Column="0" Content="ANULUJ" Height="36" Margin="0,0,5,0" Background="#1E293B" Foreground="#94A3B8" BorderThickness="0" FontWeight="Bold" FontFamily="Consolas" Cursor="Hand"/>
            <Button x:Name="BtnInstallNative" Grid.Column="1" Content="METODA 1: NATYWNA" Height="36" Margin="5,0,5,0" Background="#A855F7" Foreground="White" BorderThickness="0" FontWeight="Bold" FontFamily="Consolas" Cursor="Hand"/>
            <Button x:Name="BtnInstallDocker" Grid.Column="2" Content="METODA 2: DOCKER" Height="36" Margin="5,0,0,0" Background="#06B6D4" Foreground="Black" BorderThickness="0" FontWeight="Bold" FontFamily="Consolas" Cursor="Hand"/>
        </Grid>
    </Grid>
</Window>
"@

# Odczyt struktur WPF z kodu XAML
try {
    $reader = New-Object System.Xml.XmlNodeReader $xaml
    $window = [Windows.Markup.XamlReader]::Load($reader)
} catch {
    (Get-Date).ToString() + " BLAD GUI: " + $_.Exception.Message | Out-File "install_debug.log" -Append -Encoding utf8
    [System.Windows.MessageBox]::Show("Blad graficznego interfejsu (WPF):`n`n$($_.Exception.Message)", "Error - CYLON GUI", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Error)
    Exit
}

# Mapowanie kontrolek GUI do zmiennych PowerShell
$TxtNodeStatus = $window.FindName("TxtNodeStatus")
$TxtGitStatus = $window.FindName("TxtGitStatus")
$TxtDockerStatus = $window.FindName("TxtDockerStatus")
$TxtFilesStatus = $window.FindName("TxtFilesStatus")
$TxtTerminal = $window.FindName("TxtTerminal")
$TxtProgressPercent = $window.FindName("TxtProgressPercent")
$TxtProgressStep = $window.FindName("TxtProgressStep")
$MainProgressBar = $window.FindName("MainProgressBar")
$BtnCancel = $window.FindName("BtnCancel")
$BtnInstallNative = $window.FindName("BtnInstallNative")
$BtnInstallDocker = $window.FindName("BtnInstallDocker")

# Logowanie komunikatow w terminalu
Function Log-Terminal ($message, $type="INFO") {
    $timestamp = Get-Date -Format "HH:mm:ss"
    $formatted = "[$timestamp] [$type] $message`r`n"
    # Log to file for debugging
    $formatted | Out-File "install_debug.log" -Append -Encoding utf8
    $window.Dispatcher.Invoke([Action]{
        $TxtTerminal.AppendText($formatted)
        $TxtTerminal.ScrollToEnd()
    })
}

# Sprawdzanie i pobieranie statusow zaleznosci w tle przy starcie
Function Check-Dependencies {
    Log-Terminal "Rozpoczynam walidacje srodowiska dla metody natywnej & kontenerowej..."
    
    # 1. Sprawdzanie Node.js
    $nodeVer = $null
    try {
        $nodeVer = & node -v 2>$null
    } catch {}

    if ($nodeVer) {
        $window.Dispatcher.Invoke([Action]{
            $TxtNodeStatus.Text = "WYKRYTO ($nodeVer)"
            $TxtNodeStatus.Foreground = [System.Windows.Media.Brushes]::MediumSpringGreen
        })
        Log-Terminal "Metoda 1: Wykryto srodowisko Node.js ($nodeVer)."
    } else {
        $window.Dispatcher.Invoke([Action]{
            $TxtNodeStatus.Text = "BRAK CORES"
            $TxtNodeStatus.Foreground = [System.Windows.Media.Brushes]::Crimson
        })
        Log-Terminal "Metoda 1: Spowoduje pobranie Node.js jesli zostanie wybrana jako natywna." "INFO"
    }
}

Function Check-Git {
    $gitVer = $null
    try {
        $gitVer = & git --version 2>$null
    } catch {}

    if ($gitVer) {
        $window.Dispatcher.Invoke([Action]{
            $TxtGitStatus.Text = "WYKRYTO"
            $TxtGitStatus.Foreground = [System.Windows.Media.Brushes]::MediumSpringGreen
        })
        Log-Terminal "Git jest zintegrowany z konsola systemowa."
    } else {
        $window.Dispatcher.Invoke([Action]{
            $TxtGitStatus.Text = "BRAK (OK)"
            $TxtGitStatus.Foreground = [System.Windows.Media.Brushes]::SandyBrown
        })
        Log-Terminal "Brak Git (Asystent dokona instalacji bez gita)."
    }
}

Function Check-Docker {
    $dockerVer = $null
    try {
        $dockerVer = & docker -v 2>$null
    } catch {}

    if ($dockerVer) {
        $window.Dispatcher.Invoke([Action]{
            $TxtDockerStatus.Text = "ACTIVE"
            $TxtDockerStatus.Foreground = [System.Windows.Media.Brushes]::MediumSpringGreen
        })
        Log-Terminal "Metoda 2: Wykryto silnik Docker Desktop / WSL2 ($dockerVer)."
    } else {
        $window.Dispatcher.Invoke([Action]{
            $TxtDockerStatus.Text = "BRAK DESKTOPA"
            $TxtDockerStatus.Foreground = [System.Windows.Media.Brushes]::Crimson
        })
        Log-Terminal "Metoda 2: Blokowana - Brak uruchomionego Docker Desktop / Docker Engine." "OSTRZEZENIE"
    }
}

# Obsługa przycisku Anulowania
$BtnCancel.Add_Click({
    Log-Terminal "Zamykanie instalatora..."
    $window.Close()
})

# Funkcja glowna instalacji i dystrybucji kodu
Function Run-Installation ($Mode) {
    # Helper do UI
    $updateAction = {
        param($percent, $statusTxt, $progressBarVal)
        $TxtProgressPercent.Text = $statusTxt
        $TxtProgressStep.Text = "$percent%"
        $MainProgressBar.Value = $progressBarVal
    }
    
    $logAction = {
        param($msg, $type)
        $timestamp = Get-Date -Format "HH:mm:ss"
        $formatted = "[$timestamp] [$type] $msg`r`n"
        $TxtTerminal.AppendText($formatted)
        $TxtTerminal.ScrollToEnd()
    }

    $UpdateUI = {
        param($percent, $statusTxt, $progressBarVal)
        $window.Dispatcher.Invoke($updateAction, @($percent, $statusTxt, $progressBarVal))
    }

    $LogThread = {
        param($msg, $type="INFO")
        $window.Dispatcher.Invoke($logAction, @($msg, $type))
    }

    try {
        if ($Mode -eq "native") {
            &$LogThread "Inicjalizacja instalacji NATYWNEJ na Windows 11..." "START"
            &$UpdateUI 10 "Sprawdzanie srodowiska Node.js..." 10
            
            # KROK 1: Sprawdzenie / Doinstalowanie Node.js
            $nodeOk = $false
            try {
                if (& node -v) { $nodeOk = $true }
            } catch {}

            if (-not $nodeOk) {
                &$LogThread "Brak Node.js! Rozpoczynanie proby automatycznej instalacji..." "WYSZUKIWANIE"
                
                # Proba przez winget (Windows 10/11)
                $wingetOk = $false
                try {
                    if (& winget --version) { $wingetOk = $true }
                } catch {}

                if ($wingetOk) {
                    &$LogThread "Uzywanie narzedzia Windows Package Manager (winget)..."
                    &$UpdateUI 20 "Instalowanie Node.js via winget..." 20
                    & winget install OpenJS.NodeJS.LTS --silent --accept-package-agreements --accept-source-agreements
                    
                    # Przepiecie zmiennych srodowiskowych bez restartu konsoli
                    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                } else {
                    &$LogThread "Brak winget. Pobieranie oficjalnego instalatora Node.js LTS bezpośrednio..." "POBIERANIE"
                    &$UpdateUI 15 "Pobieranie instalatora Node.js MSI..." 15
                    $msiPath = "$env:TEMP\node-lts.msi"
                    $url = "https://nodejs.org/dist/v20.11.1/node-v20.11.1-x64.msi"
                    Invoke-WebRequest -Uri $url -OutFile $msiPath
                    
                    &$LogThread "Uruchamianie cichej instalacji MSI. Poczekaj chwile..." "INSTALACJA"
                    &$UpdateUI 25 "Instalowanie Node.js z instalatora MSI..." 25
                    Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /qn /norestart" -NoNewWindow -Wait
                    
                    # Odswiezenie zmiennej Path
                    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
                }

                # Ponowne sprawdzenie
                $nodePostCheck = $false
                try {
                    if (& node -v) { $nodePostCheck = $true }
                } catch {}

                if ($nodePostCheck) {
                    &$LogThread "Node.js zainstalowany pomyślnie!" "SUKCES"
                } else {
                    throw "Nie udalo sie zainstalowac ani aktywowac Node.js automatycznie."
                }
            }

            # KROK 2: Przygotowanie Folderow i baz danych
            &$UpdateUI 35 "Przetwarzanie struktury katalogow i baz SQLite..." 35
            &$LogThread "Inicjowanie lokalnej bazy danych i folderu dla multimediow..."
            
            $dbPath = "agents.db"
            if (-not (Test-Path $dbPath)) {
                New-Item -Path $dbPath -ItemType File -Force | Out-Null
                &$LogThread "Utworzono plik agents.db."
            } else {
                &$LogThread "Plik bazy danych agents.db wykryty, dane zostana zachowane."
            }

            if (-not (Test-Path "uploads")) {
                New-Item -Path "uploads" -ItemType Directory -Force | Out-Null
                &$LogThread "Utworzono systemowy katalog uploads/."
            }

            if (-not (Test-Path ".env")) {
                if (Test-Path ".env.example") {
                    Copy-Item ".env.example" ".env" -Force
                    &$LogThread "Utworzono plik konfiguracyjny .env z szablonu."
                } else {
                    "PORT=3000`r`nNODE_ENV=production" | Out-File ".env" -Encoding utf8
                    &$LogThread "Utworzono plik .env."
                }
            }

            $window.Dispatcher.Invoke([Action]{
                $TxtFilesStatus.Text = "GOTOWE (WIN)"
                $TxtFilesStatus.Foreground = [System.Windows.Media.Brushes]::MediumSpringGreen
            })

            # KROK 3: Instalacja NPM Packages
            &$UpdateUI 50 "Instalowanie bibliotek NPM (npm install)..." 50
            &$LogThread "Instalacja modulow npm. To moze zajac chwile..."
            
            # Uzycie cmd /c dla lepszej kompatybilnosci z npm.cmd na Windows
            $npmInstallProc = Start-Process cmd.exe -ArgumentList "/c npm install" -NoNewWindow -PassThru -Wait
            if ($npmInstallProc.ExitCode -ne 0) {
                throw "Blad podczas pobierania paczek node_modules (npm install)."
            }
            &$LogThread "Biblioteki zainstalowane prawidlowo." "SUKCES"

            # KROK 4: Budowanie i kompilacja
            &$UpdateUI 75 "Kompilacja Vite oraz backendu (npm run build)..." 75
            &$LogThread "Uruchamianie kompilatora produkcyjnego Vite i esbuild..."
            
            $npmBuildProc = Start-Process cmd.exe -ArgumentList "/c npm run build" -NoNewWindow -PassThru -Wait
            if ($npmBuildProc.ExitCode -ne 0) {
                throw "Kompilacja aplikacji produkcyjnej (npm run build) nie powiodla sie."
            }
            &$LogThread "Kompilacja i generowanie kodu produkcyjnego powiodly sie!" "SUKCES"

            # KROK 5: Uruchomienie koncowe
            &$UpdateUI 100 "System zostal pomyslnie zainstalowany NATYWNIE!" 100
            &$LogThread "AI Swarm OS v3.0 zostal kompletnie zainstalowany." "SUCCESS"
            
            [System.Windows.MessageBox]::Show("Instalacja NATYWNA AI Swarm OS v3.0 zakonczona sukcesem!`n`nMożesz teraz uruchomic srodowisko za pomoca przycisku URUCHOM lub używajac start.bat.`n`nUpewnij sie, ze skonfigurowales klucz GEMINI_API_KEY w wygenerowanym pliku .env!", "Sukces Instalacji - CYLON OS", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Information)

            $window.Dispatcher.Invoke([Action]{
                $BtnInstallNative.Content = "URUCHOM SWARM"
                $BtnInstallNative.Background = [System.Windows.Media.Brushes]::MediumSpringGreen
                $BtnInstallNative.Foreground = [System.Windows.Media.Brushes]::Black
                $BtnInstallNative.IsEnabled = $true
                $BtnInstallDocker.IsEnabled = $false
                $BtnCancel.Content = "ZAKONCZ"
                $BtnCancel.IsEnabled = $true
            })

        } elseif ($Mode -eq "docker") {
            &$LogThread "Inicjalizacja wdrozona dla Docker Desktop / Windows 11..." "START"
            &$UpdateUI 15 "Skanowanie statusu silnika Docker..." 15
            
            # KROK 1: Sprawdzenie obecności Dockera
            $dockerOk = $false
            try {
                $checkDocker = & docker -v 2>$null
                if ($checkDocker) { $dockerOk = $true }
            } catch {}

            if (-not $dockerOk) {
                throw "Brak silnika Docker! Uruchom program Docker Desktop i upewnij sie, ze dziala poprawnie."
            }
            &$LogThread "Silnik Docker Desktop jest aktywny i polaczony." "SUKCES"
            
            # KROK 2: Przygotowanie Folderow i baz danych na Host OS (Absolutnie kluczowe pod Windows 11 do unikania directory mount error)
            &$UpdateUI 30 "Tworzenie pustej struktury i deskryptora bazy..." 30
            &$LogThread "Zabezpieczanie wolumenów systemowych przed kolizja folder/plik na Windows..."
            
            $dbPath = "agents.db"
            if (-not (Test-Path $dbPath)) {
                New-Item -Path $dbPath -ItemType File -Force | Out-Null
                &$LogThread "Wymuszono stworzenie pliku bazy danych na NTFS (agents.db)."
            } else {
                &$LogThread "Wykryto plik bazy danych agents.db na NTFS hosta. Wolumen zabezpieczony."
            }

            if (-not (Test-Path "uploads")) {
                New-Item -Path "uploads" -ItemType Directory -Force | Out-Null
            }

            if (-not (Test-Path ".env")) {
                if (Test-Path ".env.example") {
                    Copy-Item ".env.example" ".env" -Force
                } else {
                    "PORT=3000`r`nNODE_ENV=production" | Out-File ".env" -Encoding utf8
                }
            }

            $window.Dispatcher.Invoke([Action]{
                $TxtFilesStatus.Text = "GOTOWE (DOCKER)"
                $TxtFilesStatus.Foreground = [System.Windows.Media.Brushes]::MediumSpringGreen
            })

            # KROK 3: Wybor komendy docker compose i budowanie obrazu
            &$UpdateUI 50 "Kompilowanie kontenera (docker compose build)..." 50
            &$LogThread "Rozpoczynam kompilacje obrazu klastra Swarm w kontenerze..."
            
            $composeCmd = "docker compose"
            try {
                $testCompose = & docker compose version 2>$null
                if (-not $testCompose) { $composeCmd = "docker-compose" }
            } catch {
                $composeCmd = "docker-compose"
            }
            &$LogThread "Wykryta komenda: $composeCmd"

            $dockerBuildProc = Start-Process cmd.exe -ArgumentList "/c $composeCmd build" -NoNewWindow -PassThru -Wait
            if ($dockerBuildProc.ExitCode -ne 0) {
                throw "Kompilacja i budowanie obrazu Docker zakonczone kodem bledu: $($dockerBuildProc.ExitCode)"
            }
            &$LogThread "Budowanie obrazu kontenerowego udane." "SUKCES"

            # KROK 4: Uruchomienie klastra Swarm w tle Desktop
            &$UpdateUI 80 "Uruchamianie serwow w tle (docker compose up -d)..." 80
            &$LogThread "Wyzwalanie uruchomienia kontenerow (Port mapowanie 3000 -> 3000)..."
            
            $dockerUpProc = Start-Process cmd.exe -ArgumentList "/c $composeCmd up -d" -NoNewWindow -PassThru -Wait
            if ($dockerUpProc.ExitCode -ne 0) {
                throw "Uruchomienie kontenerow klastra nie powiodlo sie. Kod: $($dockerUpProc.ExitCode)"
            }

            $dockerPs = & docker ps --filter "name=ai_swarm_os" --format "table {{.ID}}\t{{.Status}}\t{{.Names}}"
            &$LogThread "STATUS URUCHOMIONYCH KONTENEROW:`r`n$dockerPs" "DOCKER_INFO"

            # KROK 5: Uruchomienie koncowe
            &$UpdateUI 100 "System zostal pomyslnie zainstalowany i uruchomiony w Dockerze!" 100
            &$LogThread "Swarm OS dziala teraz w kontenerze na porcie 3000." "SUCCESS"
            
            [System.Windows.MessageBox]::Show("Instalacja w kontenerze Docker i start zakonczone sukcesem!`n`nSerwer nasłuchuje na porcie 3000 w tle Docker Desktop!`n`nMożesz teraz otworzyć adres: http://localhost:3000`n`nPamiętaj, by ustawić klucz GEMINI_API_KEY w podmontowanym pliku .env!", "Sukces Docker - CYLON OS", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Information)

            $window.Dispatcher.Invoke([Action]{
                $BtnInstallDocker.Content = "OTWORZ SWARM"
                $BtnInstallDocker.Background = [System.Windows.Media.Brushes]::MediumSpringGreen
                $BtnInstallDocker.Foreground = [System.Windows.Media.Brushes]::Black
                $BtnInstallDocker.IsEnabled = $true
                $BtnInstallNative.IsEnabled = $false
                $BtnCancel.Content = "ZAKONCZ"
                $BtnCancel.IsEnabled = $true
            })
        }
    } catch {
        &$LogThread "Faza krytyczna instalacji: $_" "KATASTROFA"
        &$UpdateUI 0 "Wystapil blad krytyczny!" 0
        [System.Windows.MessageBox]::Show("Blad instalacji klastra biezacych kontenerow:`n`n$_`n`nZweryfikuj ustawienia sieciowe, dyskowe lub Docker Desktop i sprobuj ponownie.", "Error - CYLON IP", [System.Windows.MessageBoxButton]::OK, [System.Windows.MessageBoxImage]::Error)
        
        $window.Dispatcher.Invoke([Action]{
            $BtnInstallNative.IsEnabled = $true
            $BtnInstallDocker.IsEnabled = $true
            $BtnCancel.IsEnabled = $true
        })
    }
}

# Obsługa przycisków start bez zamrazania okna GUI (Osobne watki systemowe STA)
$BtnInstallNative.Add_Click({
    if ($BtnInstallNative.Content -eq "URUCHOM SWARM") {
        Log-Terminal "Uruchamianie produkcji na porcie 3000..."
        Start-Process cmd.exe -ArgumentList "/c start.bat"
        $window.Close()
    } else {
        $BtnInstallNative.IsEnabled = $false
        $BtnInstallDocker.IsEnabled = $false
        $BtnCancel.IsEnabled = $false
        
        $thread = New-Object System.Threading.Thread([System.Threading.ThreadStart]{
            Run-Installation -Mode "native"
        })
        $thread.ApartmentState = [System.Threading.ApartmentState]::STA
        $thread.Start()
    }
})

$BtnInstallDocker.Add_Click({
    if ($BtnInstallDocker.Content -eq "OTWORZ SWARM") {
         Log-Terminal "Otwieranie platformy http://localhost:3000..."
         Start-Process "http://localhost:3000"
         $window.Close()
    } else {
        $BtnInstallNative.IsEnabled = $false
        $BtnInstallDocker.IsEnabled = $false
        $BtnCancel.IsEnabled = $false
        
        $thread = New-Object System.Threading.Thread([System.Threading.ThreadStart]{
            Run-Installation -Mode "docker"
        })
        $thread.ApartmentState = [System.Threading.ApartmentState]::STA
        $thread.Start()
    }
})

# Podstawowy start sprawdzania
$window.Add_SourceInitialized({
    Check-Dependencies
    Check-Git
    Check-Docker
})

# Pokazanie okna graficznego GUI
$window.ShowDialog() | Out-Null
