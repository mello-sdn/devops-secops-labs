import json
import os
import requests

def display_console_table(vulnerability_list):
    """Prints a clean, readable table of vulnerabilities directly into the CI logs."""
    try:
        from tabulate import tabulate
        
        headers = ["Package", "Vulnerability ID", "Severity", "Installed Version", "Fixed Version"]
        table_data = []
        
        for vuln in vulnerability_list:
            table_data.append([
                vuln.get("PkgName", "Unknown"),
                vuln.get("VulnerabilityID", "Unknown"),
                vuln.get("Severity", "Unknown"),
                vuln.get("InstalledVersion", "-"),
                vuln.get("FixedVersion", "N/A")
            ])
        
        print("\n=== DETAILED VULNERABILITY REPORT ===")
        print(tabulate(table_data, headers=headers, tablefmt="grid"))
        print("=====================================\n")
        
    except ImportError:
        print("\n=== DETAILED VULNERABILITY REPORT (Text Mode) ===")
        for vuln in vulnerability_list:
            print(f"[{vuln.get('Severity')}] {vuln.get('PkgName')} -> {vuln.get('VulnerabilityID')} (Fix: {vuln.get('FixedVersion', 'N/A')})")
        print("==================================================\n")

with open("trivy-report.json", "r") as report_file:
    trivy_data = json.load(report_file)

critical_count = 0
high_count = 0
all_detected_vulnerabilities = []

if "Results" in trivy_data:
    for result in trivy_data["Results"]:
        if "Vulnerabilities" in result:
            for vuln in result["Vulnerabilities"]:
                severity = vuln.get("Severity")
                
                if severity in ["CRITICAL", "HIGH"]:
                    all_detected_vulnerabilities.append(vuln)
                    if severity == "CRITICAL":
                        critical_count += 1
                    elif severity == "HIGH":
                        high_count += 1

if all_detected_vulnerabilities:
    display_console_table(all_detected_vulnerabilities)

if critical_count > 0 or high_count > 0:
    webhook_url = os.environ.get("DISCORD_WEBHOOK_URL")
    
    if webhook_url:
        payload = {
            "username": "Trivy Security Bot",
            "embeds": [{
                "title": "⚠️ Security Alert: Pipeline Blocked!",
                "color": 15158332,
                "description": "Trivy scanner detected unauthorized vulnerabilities. Check CI console logs for the detailed table report.",
                "fields": [
                    {"name": "🔴 Critical", "value": str(critical_count), "inline": True},
                    {"name": "🟠 High", "value": str(high_count), "inline": True}
                ]
            }]
        }
        requests.post(webhook_url, json=payload)
        
    print(f"❌ Pipeline failed. Found {critical_count} Critical and {high_count} High vulnerabilities.")
    exit(1)
else:
    print("✅ No critical or high security vulnerabilities detected by Trivy.")
