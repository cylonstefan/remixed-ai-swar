export interface TeamTemplate {
  id: string;
  name: string;
  description: string;
  agents: {
    role: string;
    personality: string;
    skills: string;
  }[];
}

export const TEAM_TEMPLATES: TeamTemplate[] = [
  {
    id: 'product-dev',
    name: 'Zespół ds. Rozwoju Produktu',
    description: 'Łączy marketing, technologię i design.',
    agents: [
      { role: 'Product Manager', personality: 'Analityczny, skoncentrowany na celach', skills: 'Strategia, Zarządzanie projektami' },
      { role: 'Lead Developer', personality: 'Techniczny, pragmatyczny', skills: 'System Architecture, TypeScript' },
      { role: 'UX/UI Designer', personality: 'Kreatywny, skoncentrowany na użytkowniku', skills: 'UI/UX Design, Figma' }
    ]
  },
  {
    id: 'creative-writing',
    name: 'Zespół Kreatywnego Pisania',
    description: 'Różne style pisania dla różnorodnych treści.',
    agents: [
      { role: 'Copywriter', personality: 'Kreatywny, perswazyjny', skills: 'Kreatywne pisanie, SEO' },
      { role: 'Editor', personality: 'Skrupulatny, krytyczny', skills: 'Edycja, Korekta' },
      { role: 'Storyteller', personality: 'Wizjonerski, emocjonalny', skills: 'Narracja, Storytelling' }
    ]
  },
  {
    id: 'music-production',
    name: 'Zespół Muzyczny',
    description: 'Generowanie i miksowanie muzyki elektronicznej i dub.',
    agents: [
      { role: 'Sound Engineer', personality: 'Precyzyjny, techniczny', skills: 'Web Audio API, Miksowanie, Sound Design' },
      { role: 'Beatmaker', personality: 'Kreatywny, rytmiczny', skills: 'Sekwencjonowanie, Rytm, Perkusja' },
      { role: 'Melody Designer', personality: 'Artystyczny, emocjonalny', skills: 'Synteza dźwięku, Kompozycja' }
    ]
  },
  {
    id: 'network-admin',
    name: 'Administracja Sieciami',
    description: 'Zarządzanie infrastrukturą sieciową, routing i bezpieczeństwo.',
    agents: [
      { role: 'Network Architect', personality: 'Analityczny, przewidujący', skills: 'Routing, Switching, BGP, Firewall' },
      { role: 'Network Security', personality: 'Czujny, defensywny', skills: 'IDS/IPS, VPN, Audyty' },
      { role: 'Network Monitor', personality: 'Szczegółowy, szybko reagujący', skills: 'Monitoring sieci, SNMP, Wireshark' }
    ]
  },
  {
    id: 'server-admin',
    name: 'Administracja Serwerami',
    description: 'Zarządzanie systemami Linux i Windows.',
    agents: [
      { role: 'Linux Admin', personality: 'Techniczny, optymalizujący', skills: 'Bash, Docker, Nginx, Linux' },
      { role: 'Windows Admin', personality: 'Uporządkowany, wspierający', skills: 'Active Directory, PowerShell, Windows Server' },
      { role: 'Server Security', personality: 'Rygorystyczny, skupiony na ochronie', skills: 'Hardening, Patch Management' }
    ]
  },
  {
    id: 'virt-admin',
    name: 'Administracja Wirtualizacją',
    description: 'Zarządzanie platformami VMware, Hyper-V, Proxmox, VirtualBox.',
    agents: [
      { role: 'VMware Specialist', personality: 'Doświadczony, stabilny', skills: 'vSphere, ESXi, vCenter' },
      { role: 'Proxmox Admin', personality: 'Elastyczny, otwarty', skills: 'KVM, ZFS, LXC' },
      { role: 'Hybrid-Virt Expert', personality: 'Praktyczny, zorientowany na wydajność', skills: 'Hyper-V, VirtualBox, Migracje' }
    ]
  }
];
