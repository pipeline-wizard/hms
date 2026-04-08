#!/bin/bash
set -e

# ============================================
# ClinicFlow - Azure Deployment Script
# Run from the VM or any machine with Azure CLI
# ============================================

# Configuration
RESOURCE_GROUP="clinicflow-rg"
LOCATION="eastus"
ENVIRONMENT="prod"
DB_ADMIN_USER="clinicadmin"
IMAGE_NAME="clinicflow"

echo "========================================="
echo "  ClinicFlow Azure Deployment"
echo "========================================="

# Check Azure CLI
if ! command -v az &> /dev/null; then
    echo "Installing Azure CLI..."
    curl -sL https://aka.ms/InstallAzureCLIDeb | sudo bash
fi

# Login check
echo "[1/8] Checking Azure login..."
az account show > /dev/null 2>&1 || az login

SUBSCRIPTION_ID=$(az account show --query id -o tsv)
echo "  Subscription: $SUBSCRIPTION_ID"

# Prompt for secrets
echo ""
read -sp "Enter PostgreSQL admin password: " DB_PASSWORD
echo ""
read -sp "Enter NextAuth secret (or press Enter to auto-generate): " NEXTAUTH_SECRET
echo ""

if [ -z "$NEXTAUTH_SECRET" ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    echo "  Generated NextAuth secret."
fi

# Create resource group
echo "[2/8] Creating resource group..."
az group create --name $RESOURCE_GROUP --location $LOCATION --output none
echo "  Resource group: $RESOURCE_GROUP ($LOCATION)"

# Deploy infrastructure with Bicep
echo "[3/8] Deploying Azure infrastructure (this takes ~5 minutes)..."
DEPLOY_OUTPUT=$(az deployment group create \
    --resource-group $RESOURCE_GROUP \
    --template-file infra/main.bicep \
    --parameters environment=$ENVIRONMENT \
                 dbAdminPassword="$DB_PASSWORD" \
                 nextAuthSecret="$NEXTAUTH_SECRET" \
    --query "properties.outputs" \
    --output json)

# Extract outputs
APP_URL=$(echo $DEPLOY_OUTPUT | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['appUrl']['value'])")
ACR_LOGIN_SERVER=$(echo $DEPLOY_OUTPUT | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['acrLoginServer']['value'])")
ACR_NAME=$(echo $DEPLOY_OUTPUT | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['acrName']['value'])")
DB_HOST=$(echo $DEPLOY_OUTPUT | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['dbHost']['value'])")
WEB_APP_NAME=$(echo $DEPLOY_OUTPUT | python3 -c "import sys,json; print(json.loads(sys.stdin.read())['webAppName']['value'])")

echo "  ACR: $ACR_LOGIN_SERVER"
echo "  DB:  $DB_HOST"
echo "  App: $APP_URL"

# Build and push Docker image
echo "[4/8] Logging into Azure Container Registry..."
az acr login --name $ACR_NAME

echo "[5/8] Building Docker image..."
docker build -t $ACR_LOGIN_SERVER/$IMAGE_NAME:latest .

echo "[6/8] Pushing Docker image to ACR..."
docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:latest

# Run database migrations
echo "[7/8] Running database migrations..."
export DATABASE_URL="postgresql://${DB_ADMIN_USER}:${DB_PASSWORD}@${DB_HOST}:5432/clinic_hms?sslmode=require"

# Add VM IP to PostgreSQL firewall temporarily
MY_IP=$(curl -s ifconfig.me)
az postgres flexible-server firewall-rule create \
    --resource-group $RESOURCE_GROUP \
    --name "clinicflow-db-${ENVIRONMENT}" \
    --rule-name "temp-deploy-${MY_IP//\./-}" \
    --start-ip-address $MY_IP \
    --end-ip-address $MY_IP \
    --output none 2>/dev/null || true

npx prisma db push --skip-generate
npx prisma db seed

# Clean up temp firewall rule
az postgres flexible-server firewall-rule delete \
    --resource-group $RESOURCE_GROUP \
    --name "clinicflow-db-${ENVIRONMENT}" \
    --rule-name "temp-deploy-${MY_IP//\./-}" \
    --yes --output none 2>/dev/null || true

# Restart app to pull new image
echo "[8/8] Restarting App Service..."
az webapp restart --resource-group $RESOURCE_GROUP --name $WEB_APP_NAME
sleep 10

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "  App URL:  $APP_URL"
echo "  ACR:      $ACR_LOGIN_SERVER"
echo "  Database: $DB_HOST"
echo ""
echo "  Default credentials:"
echo "    admin@clinicflow.com / admin123"
echo "    dr.sharma@clinicflow.com / doctor123"
echo "    reception@clinicflow.com / reception123"
echo ""
echo "  To redeploy after code changes:"
echo "    docker build -t $ACR_LOGIN_SERVER/$IMAGE_NAME:latest ."
echo "    docker push $ACR_LOGIN_SERVER/$IMAGE_NAME:latest"
echo "    az webapp restart -g $RESOURCE_GROUP -n $WEB_APP_NAME"
echo ""
