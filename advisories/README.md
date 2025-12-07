# Blackout Threat Intelligence Advisories

Security advisories for B2B marketing technology surveillance and privacy violations.

## Advisory Index

| ID | Vendor | Severity | Summary |
|----|--------|----------|---------|
| [BTI-2025-0025](./BTI-2025-0025/) | TrenDemon | **CRITICAL** | eval() ACE, polyfill.io supply chain, cross-vendor cookie harvesting |

## Structure

Each advisory folder contains:

```
/BTI-YYYY-NNNN/
  README.md        # Human-readable advisory
  advisory.yaml    # Machine-readable IOCs and metadata
  /evidence/       # Optional: supporting artifacts
```

## Usage

### Human Readers
Browse to any advisory folder - GitHub auto-renders the README.

### Automation/SIEM
```bash
# Fetch all IOCs for a specific advisory
curl https://raw.githubusercontent.com/Blackout-Threat-Intel/blackout-protocol/main/advisories/BTI-2025-0025/advisory.yaml

# Parse domains to block
yq '.iocs.domains[].domain' advisory.yaml
```

## Severity Levels

| Level | BTSS Score | Description |
|-------|------------|-------------|
| **CRITICAL** | 9.0-10.0 | Arbitrary code execution, active supply chain compromise |
| **HIGH** | 7.0-8.9 | Severe privacy violation, cross-vendor data sharing |
| **MEDIUM** | 4.0-6.9 | Significant tracking, excessive retention |
| **LOW** | 1.0-3.9 | Minor issues, informational |

## License

Advisory content is provided for defensive security purposes under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/).

---

*Maintained by [Blackout Threat Intelligence](https://github.com/Blackout-Threat-Intel)*
