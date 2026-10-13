// ============================================================
// BREACH//REWIND — Deterministic Attack Scenarios
// ============================================================

import { Scenario, CyberEvent } from '@shared/types';

/**
 * Scenario 1: 60-Second APT Attack
 * A slow, multi-phase advanced persistent threat that unfolds
 * across distinct attack phases with escalating severity.
 *
 * NOTE: This is a scripted synthetic scenario for demonstration.
 * It does not represent a real captured network trace.
 */
export const APT_SCENARIO: Scenario = {
  id: 'apt_60s',
  name: 'Advanced Persistent Threat (60s)',
  description:
    'A stealthy multi-phase attack progressing from valid login through reconnaissance, privilege escalation, lateral movement, and data exfiltration over 60 seconds.',
  duration: 60,
  isSynthetic: true,
  events: [
    {
      id: 'evt_001',
      timestamp: 0,
      type: 'Valid SSH Login',
      phase: 'valid_login',
      severity: 'normal',
      description: 'Authenticated session established with valid credentials from known IP range.',
      features: [0.05, 0.0, 0.0, 0.0, 0.02],
      explanation:
        'A standard authenticated login. All credentials match. Source IP is within the expected subnet. No anomaly signals.',
    },
    {
      id: 'evt_002',
      timestamp: 8,
      type: 'Off-Hours VPN Ingress',
      phase: 'unexpected_ingress',
      severity: 'suspicious',
      description: 'VPN tunnel established outside business hours from unusual geographic location.',
      features: [0.35, 0.1, 0.05, 0.0, 0.15],
      explanation:
        'The session originates from an unusual ASN at 02:47 local time. The source GeoIP does not match historical login patterns. Individually, this could be legitimate remote work.',
    },
    {
      id: 'evt_003',
      timestamp: 18,
      type: 'Internal Host Discovery',
      phase: 'host_discovery',
      severity: 'suspicious',
      description: 'Rapid ARP/ICMP sweep across internal /24 subnet from the authenticated session.',
      features: [0.15, 0.55, 0.15, 0.05, 0.30],
      explanation:
        'Network reconnaissance detected: 47 ICMP echo requests to sequential internal IPs within 2.3 seconds. Consistent with host discovery tools (nmap -sn). Each individual ping is benign, but the temporal density is anomalous.',
    },
    {
      id: 'evt_004',
      timestamp: 30,
      type: 'Privilege Token Manipulation',
      phase: 'privilege_escalation',
      severity: 'critical',
      description: 'Kerberos TGT request with suspicious SPN targeting domain admin service.',
      features: [0.2, 0.1, 0.65, 0.1, 0.45],
      explanation:
        'A Kerberoasting-style service ticket request was observed targeting the KRBTGT service principal. The requesting account does not have prior history of admin-level ticket requests. Combined with the prior reconnaissance, this elevates the threat significantly.',
    },
    {
      id: 'evt_005',
      timestamp: 41,
      type: 'Lateral SMB Pivot',
      phase: 'lateral_movement',
      severity: 'critical',
      description: 'SMB/RPC connections to 3 internal hosts using the escalated token.',
      features: [0.1, 0.2, 0.7, 0.25, 0.55],
      explanation:
        'The compromised session established SMB connections to FILE-SRV-01, DC-BACKUP-02, and HR-DB-03 using the newly obtained service ticket. This lateral spread pattern matches known APT post-exploitation behavior.',
    },
    {
      id: 'evt_006',
      timestamp: 52,
      type: 'Data Exfiltration Burst',
      phase: 'exfiltration',
      severity: 'critical',
      description: 'Large encrypted data transfer to external endpoint via DNS tunneling.',
      features: [0.1, 0.05, 0.15, 0.85, 0.70],
      explanation:
        'A burst of oversized DNS TXT responses (avg 4.2 KB each) detected over 8 seconds, totaling ~340 KB of encoded data transmitted to an external resolver. This pattern is consistent with DNS-based data exfiltration (e.g., dnscat2). The cumulative membrane state from all prior events makes this the highest-threat moment.',
    },
  ],
};

/**
 * Scenario 2: Sudden Burst Ransomware
 * A rapid, aggressive attack with minimal stealth.
 */
export const BURST_SCENARIO: Scenario = {
  id: 'burst_ransomware',
  name: 'Sudden Burst Ransomware',
  description:
    'An aggressive ransomware deployment with rapid credential stuffing, immediate privilege escalation, and mass file encryption within 60 seconds.',
  duration: 60,
  isSynthetic: true,
  events: [
    {
      id: 'burst_001',
      timestamp: 0,
      type: 'Credential Stuffing Attempt',
      phase: 'valid_login',
      severity: 'suspicious',
      description: 'Multiple rapid login attempts from a single source IP.',
      features: [0.6, 0.1, 0.1, 0.0, 0.3],
      explanation:
        'Burst of 23 failed login attempts in 4 seconds from a single external IP, followed by one successful authentication. Pattern consistent with credential stuffing.',
    },
    {
      id: 'burst_002',
      timestamp: 10,
      type: 'Immediate Admin Escalation',
      phase: 'privilege_escalation',
      severity: 'critical',
      description: 'Local admin privilege obtained via known exploit within seconds of login.',
      features: [0.3, 0.2, 0.8, 0.1, 0.6],
      explanation:
        'Privilege escalation exploit executed immediately after authentication. Zero reconnaissance phase — attacker appears to have pre-existing knowledge of the environment.',
    },
    {
      id: 'burst_003',
      timestamp: 20,
      type: 'Mass SMB Propagation',
      phase: 'lateral_movement',
      severity: 'critical',
      description: 'Rapid lateral spread to 15+ hosts via SMB with admin credentials.',
      features: [0.2, 0.3, 0.9, 0.3, 0.75],
      explanation:
        'WMI and PSExec-style execution spreading to all reachable Windows hosts on the segment. 15 simultaneous SMB sessions opened within 3 seconds.',
    },
    {
      id: 'burst_004',
      timestamp: 30,
      type: 'Encryption Payload Deploy',
      phase: 'exfiltration',
      severity: 'critical',
      description: 'Ransomware binary deployed and file encryption begins across compromised hosts.',
      features: [0.15, 0.1, 0.5, 0.95, 0.9],
      explanation:
        'Mass file rename operations detected across 15 hosts (*.encrypted extension). Shadow copy deletion commands executed. Ransom note dropped in each directory.',
    },
    {
      id: 'burst_005',
      timestamp: 40,
      type: 'C2 Beacon Established',
      phase: 'exfiltration',
      severity: 'critical',
      description: 'Persistent command-and-control beaconing to external infrastructure.',
      features: [0.3, 0.15, 0.4, 0.7, 0.8],
      explanation:
        'Periodic HTTPS POST requests every 5 seconds to an external domain registered 2 days ago. Payload contains encrypted system information and encryption status reports.',
    },
  ],
};

/**
 * Scenario 3: Benign Heavy Traffic
 * Normal operations with high volume — should NOT trigger spikes
 * when parameters are reasonable.
 */
export const BENIGN_SCENARIO: Scenario = {
  id: 'benign_traffic',
  name: 'Normal Traffic (Control)',
  description:
    'High-volume but legitimate network activity including batch jobs, backups, and standard user operations. Control scenario — no attack present.',
  duration: 60,
  isSynthetic: true,
  events: [
    {
      id: 'benign_001',
      timestamp: 0,
      type: 'Morning Login Batch',
      phase: 'benign',
      severity: 'normal',
      description: 'Standard batch of employee logins at shift start.',
      features: [0.08, 0.02, 0.01, 0.02, 0.03],
      explanation:
        'Normal morning authentication surge. All credentials valid, all source IPs from known corporate ranges.',
    },
    {
      id: 'benign_002',
      timestamp: 12,
      type: 'Scheduled Backup Job',
      phase: 'benign',
      severity: 'normal',
      description: 'Automated backup system accessing file servers.',
      features: [0.03, 0.05, 0.06, 0.12, 0.05],
      explanation:
        'Scheduled Veeam backup job accessing file servers. High data transfer volume but from the dedicated backup service account with expected access patterns.',
    },
    {
      id: 'benign_003',
      timestamp: 25,
      type: 'Software Update Distribution',
      phase: 'benign',
      severity: 'normal',
      description: 'WSUS/SCCM pushing patches to endpoint fleet.',
      features: [0.02, 0.04, 0.03, 0.10, 0.04],
      explanation:
        'Configuration Manager distributing monthly patches. Multi-host SMB connections from the SCCM distribution point are expected and authorized.',
    },
    {
      id: 'benign_004',
      timestamp: 38,
      type: 'Database Maintenance Window',
      phase: 'benign',
      severity: 'normal',
      description: 'Scheduled SQL maintenance with elevated resource usage.',
      features: [0.04, 0.03, 0.08, 0.06, 0.04],
      explanation:
        'Scheduled database index rebuild and statistics update. Elevated CPU and I/O on DB-PROD-01 within the defined maintenance window.',
    },
    {
      id: 'benign_005',
      timestamp: 50,
      type: 'End-of-Day Report Generation',
      phase: 'benign',
      severity: 'normal',
      description: 'Automated report generation with external API calls.',
      features: [0.03, 0.02, 0.02, 0.08, 0.03],
      explanation:
        'Business intelligence reports pulling data from multiple internal sources and pushing formatted exports to the authorized cloud storage endpoint.',
    },
  ],
};

/** All available scenarios */
export const SCENARIOS: Scenario[] = [
  APT_SCENARIO,
  BURST_SCENARIO,
  BENIGN_SCENARIO,
];

/** Get scenario by ID */
export function getScenarioById(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
