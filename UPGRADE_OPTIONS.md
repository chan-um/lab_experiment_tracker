# Upgrade Options for Google Cloud (With Credits)

Since you have Google Cloud credits, here are options to improve performance:

## Cloud Run Upgrades

### Current Settings (Free Tier)
- Memory: 512 MiB
- CPU: 1 vCPU (shared)
- Max instances: 10
- Timeout: 300 seconds

### Recommended Upgrades

```bash
# Upgrade to better performance
gcloud run services update lab-app \
  --region us-east1 \
  --memory 2Gi \
  --cpu 2 \
  --max-instances 100 \
  --timeout 900 \
  --concurrency 80
```

**Benefits:**
- More memory for handling requests
- Dedicated CPU (better performance)
- Higher concurrency (more simultaneous users)
- Longer timeout for complex operations

**Cost:** ~$0.10-0.50/hour when running (only pay when handling requests)

## Cloud SQL Upgrades

### Current Settings (db-f1-micro)
- Shared CPU
- 0.6 GB RAM
- 10 GB storage

### Recommended Upgrades

```bash
# Upgrade to db-g1-small (better for production)
gcloud sql instances patch lab-db \
  --tier=db-g1-small

# Or db-n1-standard-1 for even better performance
gcloud sql instances patch lab-db \
  --tier=db-n1-standard-1
```

**Tier Options:**
- `db-g1-small`: 1 vCPU, 1.7 GB RAM (~$25/month)
- `db-n1-standard-1`: 1 vCPU, 3.75 GB RAM (~$50/month)
- `db-n1-standard-2`: 2 vCPU, 7.5 GB RAM (~$100/month)

**Storage:**
```bash
# Increase storage if needed
gcloud sql instances patch lab-db \
  --storage-size=50GB
```

## Cloud Build Upgrades

### Enable Cloud Build API (if not already)
```bash
gcloud services enable cloudbuild.googleapis.com
```

### Use faster build machines (optional)
```bash
# Use high-CPU machines for faster builds
gcloud builds submit --machine-type=n1-highcpu-8 --tag gcr.io/cs348hw3-474718/lab-app
```

## Monitoring & Logging

### Enable Cloud Monitoring (Free tier available)
```bash
gcloud services enable monitoring.googleapis.com
```

### View metrics in Cloud Console
- Go to Cloud Run → lab-app → Metrics
- Monitor: Requests, Latency, Errors, CPU, Memory

## Cost Optimization Tips

Even with credits, optimize costs:

1. **Set max instances** to prevent runaway costs:
   ```bash
   gcloud run services update lab-app --max-instances 10 --region us-east1
   ```

2. **Use Cloud SQL Proxy** for local development (free)

3. **Enable Cloud SQL backups** (small cost, but worth it):
   ```bash
   gcloud sql instances patch lab-db \
     --backup-start-time=03:00
   ```

4. **Set up budget alerts**:
   - Go to Billing → Budgets & alerts
   - Set a budget limit
   - Get email alerts

## Recommended Production Setup (With Credits)

```bash
# 1. Upgrade Cloud Run
gcloud run services update lab-app --region us-east1 --memory 2Gi --cpu 2 --max-instances 50 --min-instances 1 --timeout 900

# 2. Upgrade Cloud SQL
gcloud sql instances patch lab-db --tier=db-g1-small --storage-size=20GB --backup-start-time=03:00

# 3. Enable monitoring
gcloud services enable monitoring.googleapis.com logging.googleapis.com
```

**Estimated Monthly Cost:**
- Cloud Run: ~$10-30 (depending on traffic)
- Cloud SQL (db-g1-small): ~$25
- Storage: ~$2-5
- **Total: ~$37-60/month**

## Quick Upgrade Commands

### Just upgrade Cloud Run performance:
```bash
gcloud run services update lab-app \
  --region us-east1 \
  --memory 2Gi \
  --cpu 2
```

### Just upgrade Cloud SQL:
```bash
gcloud sql instances patch lab-db \
  --tier=db-g1-small
```

### Check current settings:
```bash
# Cloud Run
gcloud run services describe lab-app --region us-east1

# Cloud SQL
gcloud sql instances describe lab-db
```

