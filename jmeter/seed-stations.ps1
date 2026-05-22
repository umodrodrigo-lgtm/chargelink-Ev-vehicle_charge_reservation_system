param(
    [string]$BaseUrl       = "http://localhost:8081/api",
    [string]$AdminEmail    = "admin@chargelink.com",
    [string]$AdminPassword = "Admin@1234"
)

function Invoke-Api($Method, $Path, $Body, $Token) {
    $p = @{ Method = $Method; Uri = "$BaseUrl$Path"; ContentType = 'application/json' }
    if ($Token) { $p.Headers = @{ Authorization = "Bearer $Token" } }
    if ($Body)  { $p.Body    = ($Body | ConvertTo-Json -Depth 5) }
    Invoke-RestMethod @p
}

Write-Host "Logging in..." -ForegroundColor Cyan
$login = Invoke-Api POST '/auth/login' @{ email = $AdminEmail; password = $AdminPassword }
$token = $login.data.accessToken
Write-Host "Login OK" -ForegroundColor Green

$stations = @(
  @{ name="ChargeLink Hub 1";  address="100 Market St";   city="San Francisco"; state="CA"; zipCode="94101"; latitude=37.774900; longitude=-122.419400; openingHours="24/7";               phoneNumber="+14155550001"; status="ACTIVE" },
  @{ name="ChargeLink Hub 2";  address="200 Mission St";  city="San Francisco"; state="CA"; zipCode="94102"; latitude=37.778900; longitude=-122.414400; openingHours="6:00 AM - 11:00 PM"; phoneNumber="+14155550002"; status="ACTIVE" },
  @{ name="ChargeLink Hub 3";  address="300 Howard St";   city="San Francisco"; state="CA"; zipCode="94103"; latitude=37.782900; longitude=-122.409400; openingHours="7:00 AM - 10:00 PM"; phoneNumber="+14155550003"; status="ACTIVE" },
  @{ name="ChargeLink Hub 4";  address="400 Folsom St";   city="San Francisco"; state="CA"; zipCode="94104"; latitude=37.786900; longitude=-122.404400; openingHours="24/7";               phoneNumber="+14155550004"; status="ACTIVE" },
  @{ name="ChargeLink Hub 5";  address="500 Harrison St"; city="San Francisco"; state="CA"; zipCode="94105"; latitude=37.790900; longitude=-122.399400; openingHours="8:00 AM - 9:00 PM";  phoneNumber="+14155550005"; status="ACTIVE" },
  @{ name="ChargeLink Hub 6";  address="600 Bryant St";   city="Oakland";       state="CA"; zipCode="94106"; latitude=37.792900; longitude=-122.421400; openingHours="24/7";               phoneNumber="+14155550006"; status="ACTIVE" },
  @{ name="ChargeLink Hub 7";  address="700 Brannan St";  city="Oakland";       state="CA"; zipCode="94107"; latitude=37.796900; longitude=-122.416400; openingHours="6:00 AM - 12:00 AM"; phoneNumber="+14155550007"; status="ACTIVE" },
  @{ name="ChargeLink Hub 8";  address="800 Townsend St"; city="Berkeley";      state="CA"; zipCode="94108"; latitude=37.800900; longitude=-122.411400; openingHours="7:00 AM - 11:00 PM"; phoneNumber="+14155550008"; status="ACTIVE" },
  @{ name="ChargeLink Hub 9";  address="900 King St";     city="Palo Alto";     state="CA"; zipCode="94109"; latitude=37.804900; longitude=-122.406400; openingHours="24/7";               phoneNumber="+14155550009"; status="ACTIVE" },
  @{ name="ChargeLink Hub 10"; address="1000 Berry St";   city="San Jose";      state="CA"; zipCode="94110"; latitude=37.808900; longitude=-122.401400; openingHours="6:00 AM - 10:00 PM"; phoneNumber="+14155550010"; status="ACTIVE" }
)

$chargers = @(
  @{ chargerNumber="C1"; type="CCS";     powerKw=150; pricePerKwh=0.35 },
  @{ chargerNumber="C2"; type="TYPE_2";  powerKw=22;  pricePerKwh=0.25 },
  @{ chargerNumber="C3"; type="CHADEMO"; powerKw=50;  pricePerKwh=0.30 },
  @{ chargerNumber="C4"; type="CCS";     powerKw=350; pricePerKwh=0.45 },
  @{ chargerNumber="C5"; type="TESLA";   powerKw=250; pricePerKwh=0.40 }
)

$okS = 0; $okC = 0

foreach ($s in $stations) {
    Write-Host ""
    Write-Host "$($s.name)" -ForegroundColor Yellow

    $sid = $null
    try {
        $r = Invoke-Api POST '/stations' $s $token
        $sid = $r.data.id
        $okS++
        Write-Host "  Created station $sid" -ForegroundColor Green
    } catch {
        Write-Host "  FAILED: $($_.Exception.Message)" -ForegroundColor Red
        continue
    }

    foreach ($c in $chargers) {
        $cb = @{ stationId=$sid; chargerNumber=$c.chargerNumber; type=$c.type; powerKw=$c.powerKw; pricePerKwh=$c.pricePerKwh }
        try {
            Invoke-Api POST '/chargers' $cb $token | Out-Null
            Write-Host "  + $($c.chargerNumber) $($c.type) $($c.powerKw)kW" -ForegroundColor DarkGreen
            $okC++
        } catch {
            Write-Host "  ! $($c.chargerNumber) FAILED: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Write-Host ""
Write-Host "Done: $okS stations, $okC chargers created." -ForegroundColor Cyan
