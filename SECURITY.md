# Security Policy

## Supported versions

LombokCharts is pre-1.0. Security fixes are applied to the latest `0.x` release.

| Version | Supported |
| ------- | --------- |
| 0.1.x   | ✅        |

## Reporting a vulnerability

Please **do not** open a public issue for security vulnerabilities.

Instead, use GitHub's private vulnerability reporting:
**Security → Report a vulnerability** on the repository, or contact the
maintainer privately.

Include a description, affected version(s), and a minimal reproduction if
possible. We aim to acknowledge reports within a few days and will keep you
informed as we work on a fix.

## Scope notes

LombokCharts has **zero runtime dependencies** and does not perform network
requests, read cookies, or access storage on its own. Its main attack surface is
the data and configuration you pass in. When rendering untrusted labels/values,
treat them as untrusted content in your own DOM as usual.
