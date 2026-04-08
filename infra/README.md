# ClinicFlow - Azure Infrastructure

## Quick Deploy (from VM)

```bash
cd /root/clinicflow
chmod +x infra/deploy.sh
./infra/deploy.sh
```

## What gets created

| Resource | SKU | ~Cost/month |
|----------|-----|-------------|
| Azure Container Registry | Basic | $5 |
| PostgreSQL Flexible Server | Burstable B1ms | $13 |
| App Service Plan (Linux) | B1 | $13 |
| App Service | - | Included |
| **Total** | | **~$31** |

## Manual Deployment Steps

### 1. Install Azure CLI
```bash
curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
az login
```

### 2. Deploy Infrastructure
```bash
az group create --name clinicflow-rg --location eastus

az deployment group create \
  --resource-group clinicflow-rg \
  --template-file infra/main.bicep \
  --parameters environment=prod \
               dbAdminPassword="YourStr0ng!Pass" \
               nextAuthSecret="$(openssl rand -base64 32)"
```

### 3. Build & Push Docker Image
```bash
ACR_NAME=$(az acr list -g clinicflow-rg --query "[0].name" -o tsv)
az acr login --name $ACR_NAME
ACR_SERVER=$(az acr show -n $ACR_NAME --query loginServer -o tsv)

docker build -t $ACR_SERVER/clinicflow:latest .
docker push $ACR_SERVER/clinicflow:latest
```

### 4. Run Migrations
```bash
DB_HOST=$(az postgres flexible-server list -g clinicflow-rg --query "[0].fullyQualifiedDomainName" -o tsv)
export DATABASE_URL="postgresql://clinicadmin:YourStr0ng!Pass@$DB_HOST:5432/clinic_hms?sslmode=require"
npx prisma db push
npx prisma db seed
```

### 5. Restart App
```bash
WEB_APP=$(az webapp list -g clinicflow-rg --query "[0].name" -o tsv)
az webapp restart -g clinicflow-rg -n $WEB_APP
```

## CI/CD (GitHub Actions)

The workflow at `.github/workflows/deploy.yml` auto-deploys on push to `main`.

### Required GitHub Secrets
- `AZURE_CREDENTIALS` - Service principal JSON
- `ACR_PASSWORD` - ACR admin password

### Create Service Principal
```bash
az ad sp create-for-rbac --name clinicflow-deploy \
  --role contributor \
  --scopes /subscriptions/{sub-id}/resourceGroups/clinicflow-rg \
  --sdk-auth
```
Copy the JSON output to GitHub Secrets as `AZURE_CREDENTIALS`.
