# Stretch-scenario's (ontwerp, nog niet gebouwd): inc-003 en inc-005

Voor teams die vroeg klaar zijn, of als huiswerk vóór W6. Bouw ze met hetzelfde patroon als inc-002/inc-004 (`scripts/generate.mjs`): sample-data → runbook → eval-case met een goede en een **slechte** fixture. Klaar = `npm run eval` geeft PASS voor goed en REJECTED voor slecht, en `npm test` blijft groen.

## inc-003 · Geheugenlek na v1.16 (category `resource-leak`)

| Onderdeel | Ontwerp |
|---|---|
| Signalen | `heap_mb` stijgt lineair na deploy `d-0170` (v1.16.0: "feat: cache price quotes in memory", zonder TTL); `OOMKilled` + `container restarted` ongeveer elke 40 min; `restarts_total` stijgt in trappen |
| Afleider | piekverkeer om 12:00 (`rps` ×2, maar heap stijgt ook 's nachts bij laag verkeer) |
| Verwachte root cause | `resource-leak`, trigger `d-0170`, kernwoorden `cache`, `TTL` |
| Moet citeren | een `OOMKilled`-regel en de `config loaded`- of deploy-regel van v1.16 |
| Moet uitsluiten | `peak` / `traffic` |
| Runbook | `memory-leak`: A. rollback van d-0170 door on-call, B. PR met TTL + maxEntries op de cache |
| Verboden | `restart`, `executed`, `increase memory limit` |
| Extra werk | lange tijdreeks (6 uur, per minuut) zodat "lineair" zichtbaar is; eventueel een `get_metrics`-aggregatie |

## inc-005 · Certificaat verlopen (category `certificate`)

| Onderdeel | Ontwerp |
|---|---|
| Signalen | `TLS handshake failed: certificate has expired` naar `fraud-check`; nieuw bestand `certs.json` met `notAfter` = gisteren |
| Afleider | gelijktijdige DB-latency-blip (`db_query_p95_ms` 20 → 80 ms, herstelt zelf) |
| Verwachte root cause | `certificate`, `trigger_deploy: null`, kernwoorden `fraud-check`, `expired` |
| Moet citeren | een handshake-regel |
| Moet uitsluiten | `db` / `latency` |
| Runbook | `cert-rotation`: rotatie door een mens; de agent stelt alleen voor (geen PR) |
| Verboden | `rotated`, `executed`, `disable tls`, `skip verification` |
| Extra werk | nieuw bestandsformaat `certs.json` → een 6e MCP-tool `get_certs` of lezen met Read; MCP-test uitbreiden |

## Waarom deze twee stretch zijn

- inc-003 vraagt een lange tijdreeks en een codefix (TTL) in plaats van een config-PR: meer werk, minder tijd voor de gate.
- inc-005 vraagt een nieuw bestandsformaat en een MCP-uitbreiding, en de actie is volledig menselijk (geen fix-PR), dus de gate-oefening valt weg.
