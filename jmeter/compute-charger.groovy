String[] types   = ['CCS',  'TYPE_2', 'CHADEMO', 'CCS',  'TESLA']
String[] powers  = ['150',  '22',     '50',       '350',  '250'  ]
String[] prices  = ['0.35', '0.25',   '0.30',     '0.45', '0.40' ]
String[] labels  = ['C1',   'C2',     'C3',       'C4',   'C5'   ]

// Reset slot counter when station changes, increment within station
String curStation = vars.get('stationNum')
int slot
if (curStation != vars.get('_lastStation')) {
    slot = 0
    vars.put('_lastStation', curStation)
} else {
    slot = Integer.parseInt(vars.get('_chargerSlot') ?: '0') + 1
}
vars.put('_chargerSlot', String.valueOf(slot))

vars.put('chargerType',   types[slot])
vars.put('chargerPower',  powers[slot])
vars.put('chargerPrice',  prices[slot])
vars.put('chargerLabel',  labels[slot])
log.info('  Charger ' + labels[slot] + ': ' + types[slot] + ' ' + powers[slot] + 'kW')
