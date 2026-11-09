#!/usr/bin/env bash
# Exemplos de chamadas à API para a apresentação. Uso: ./scripts/demo.sh [http://localhost:8080]
set -euo pipefail
API="${1:-http://localhost:8080}"
KEY="${INGEST_API_KEY:-dev-ingest-key}"
j() { if command -v jq >/dev/null; then jq "$@"; else cat; fi; }

echo "== Saúde da API"; curl -s "$API/actuator/health" | j .
echo; echo "== Leitura de sensor (alagamento crítico em Brasilândia)"
curl -s -X POST "$API/api/v1/ingest/sensor" -H "Content-Type: application/json" -H "X-API-Key: $KEY" \
  -d '{"sensorCode":"demo-flood-01","sensorName":"Sensor demo Brasilândia","riskType":"FLOOD","value":85,"region":"Brasilândia","latitude":-23.4697,"longitude":-46.688}' | j .
echo; echo "== Lote de base pública"
curl -s -X POST "$API/api/v1/ingest/public" -H "Content-Type: application/json" -H "X-API-Key: $KEY" \
  -d '{"datasetCode":"inmet-demo","datasetName":"INMET (demo)","records":[{"riskType":"HEAT_ISLAND","value":39.5,"region":"Itaquera","latitude":-23.54,"longitude":-46.456}]}' | j .
echo; echo "== Relato comunitário (dados pessoais são removidos antes de salvar)"
curl -s -X POST "$API/api/v1/ingest/community" -H "Content-Type: application/json" \
  -d '{"riskType":"FLOOD","level":"HIGH","latitude":-23.4701,"longitude":-46.6883,"description":"Rua alagada, me liga 11 98765-4321","reporterId":"demo-device"}' | j .
echo; echo "== Alertas priorizados (top 3)"
curl -s "$API/api/v1/alerts?size=3" | j '.items[] | {title, severity, priorityScore, confidence, sources, factors}'
echo; echo "== Sem API key (deve dar 401)"
curl -s -o /dev/null -w "%{http_code}\n" -X POST "$API/api/v1/ingest/sensor" -H "Content-Type: application/json" -d '{}'
