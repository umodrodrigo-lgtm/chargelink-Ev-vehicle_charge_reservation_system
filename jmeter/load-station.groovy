def csvFile = new File('F:/Projects/ChargeLink/production/jmeter/stations.csv')
def lines = csvFile.readLines('UTF-8')

// lines[0] = header row, lines[1..10] = station data
int n = Integer.parseInt(vars.get('stationNum'))
if (n >= lines.size()) {
    log.error('stations.csv has no row for stationNum=' + n + ' (only ' + (lines.size() - 1) + ' data rows)')
    return
}

def cols = lines[n].split(',', -1)
vars.put('stationName',    cols[0].trim())
vars.put('stationAddress', cols[1].trim())
vars.put('stationCity',    cols[2].trim())
vars.put('stationState',   cols[3].trim())
vars.put('stationZip',     cols[4].trim())
vars.put('stationLat',     cols[5].trim())
vars.put('stationLng',     cols[6].trim())
vars.put('stationHours',   cols[7].trim())
vars.put('stationPhone',   cols[8].trim())
log.info('Station ' + n + ': ' + cols[0].trim() + ' @ ' + cols[5].trim() + ',' + cols[6].trim())
