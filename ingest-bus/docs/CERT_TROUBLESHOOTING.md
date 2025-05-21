# SSL/TLS Certificate Troubleshooting Guide

This document provides guidance for resolving SSL/TLS certificate issues when accessing TORI services, particularly when uploading documents.

## Understanding the Error

If you encounter an `ERR_CERT_COMMON_NAME_INVALID` error, it means the TLS certificate presented by the server (e.g., app.tori.dev) does not match the hostname you're trying to access. This is typically a server-side certificate misconfiguration, such as:

- The certificate is issued for `*.tori.dev` but the site responds at `app.tori.dev`
- The certificate is self-signed and intended only for localhost
- The certificate's Subject Alternative Names (SANs) don't include the hostname you're using

The browser blocks the connection as a security measure since it can't verify you're communicating with the intended server.

## Quick Workarounds

While waiting for the operations team to fix the certificate issue, here are some workarounds:

### 1. Direct Bucket Upload with gsutil

If you just need your documents ingested without using the web interface:

```bash
gsutil cp *.pdf gs://chopinbucket1/Chopin/raw/autism/
```

Or for specific document tracks:

```bash
gsutil cp *.pdf gs://chopinbucket1/Chopin/raw/programming/
```

The ingest-bus watcher will automatically queue these files, and you can monitor progress via Prometheus/Grafana even while the UI is down.

### 2. Alternative Hostnames

Try accessing TORI through alternative hostnames that might have valid certificates:

- `https://ide.tori.dev`
- `https://tori.dev/chat`

### 3. Temporary Browser Override (Not Recommended for Production)

For development environments only:
1. Click "Advanced" in the browser error page
2. Click "Proceed to [site] (unsafe)"

**Warning**: This leaves your connection potentially vulnerable to man-in-the-middle attacks. Don't use this approach with sensitive data or credentials.

### 4. Local Reverse Proxy (Advanced)

For advanced users who control DNS:
1. Point `app.tori.dev` in `/etc/hosts` to your proxy
2. Terminate TLS at your proxy with a valid certificate
3. Forward requests to the backend

## Requesting a Certificate Fix

For the operations team to fix the issue:

1. Check the certificate configuration:
   ```bash
   openssl s_client -connect app.tori.dev:443 -servername app.tori.dev \
        | openssl x509 -noout -text | grep -A1 "Subject Alternative Name"
   ```

2. Re-issue a certificate that includes the correct hostname:
   ```bash
   certbot certonly --dns <provider> -d app.tori.dev
   ```

3. Update the certificate in the load balancer or ingress configuration

4. Purge any certificate caches or HSTS settings

## Uploading to TORI When the Web UI is Inaccessible

If you need to upload PDFs immediately and can't wait for a certificate fix:

```powershell
# For Windows
gsutil cp C:\Docs\Papers\*.pdf gs://chopinbucket1/Chopin/raw/autism/
```

```bash
# For Linux/macOS
gsutil cp ~/Documents/Papers/*.pdf gs://chopinbucket1/Chopin/raw/programming/
```

The ingest-bus service will automatically process these files. You can track their progress through:
1. Prometheus metrics
2. Grafana dashboards
3. The IDE interface once it becomes available again

## Getting Help

If you encounter certificate issues:
1. Contact the operations team through the ops channel
2. Open a Kaizen CERT-FAIL ticket with the detailed error message
3. Provide the hostname you're trying to access and the exact error displayed by your browser

This ensures the certificate can be fixed promptly for all users.
