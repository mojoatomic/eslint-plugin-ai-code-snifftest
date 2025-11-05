"use strict";

// Provenance: Networking terminology
module.exports = Object.freeze({
  constants: [
    80,        // HTTP port
    443,       // HTTPS port
    1500,      // Standard Ethernet MTU
    65535,     // Max port number / max uint16
    1024       // First non-privileged port
  ],
  constantMeta: [
    { value: 80, name: 'HTTP_PORT', description: 'Standard HTTP port' },
    { value: 443, name: 'HTTPS_PORT', description: 'Standard HTTPS port' },
    { value: 1500, name: 'ETHERNET_MTU', description: 'Standard Ethernet MTU (bytes)' },
    { value: 65535, name: 'MAX_PORT', description: 'Maximum TCP/UDP port number' },
    { value: 1024, name: 'FIRST_UNPRIVILEGED_PORT', description: 'First non-privileged port number' }
  ],
  terms: [
    'ip','ipv4','ipv6','tcp','udp','port','socket','packet','latency','throughput','bandwidth','dns','http','https','tls'
  ]
});
