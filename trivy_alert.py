import os
import requests
import json

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

with open("trivy_report.json", "r") as report_file:
    trivy_data = json.load(report_file)




