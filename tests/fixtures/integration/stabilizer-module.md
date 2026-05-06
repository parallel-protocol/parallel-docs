# Stabilizer Module

The Stabilizer Module is the core mechanism of eUSD. It handles minting and redemption operations across multiple chains, providing automated arbitrage to maintain the peg.

## #️⃣ Architecture

The module is composed of three contracts that interact with the [audits report](/security/audits.md) for any compliance reference.

A relative link example: see [Implementation](implementation.md) for low-level details.

<figure>
  <img src="/files/aaa111" alt="High-level architecture">
  <figcaption>High-level architecture</figcaption>
</figure>

### #️⃣ Mint flow

When a user mints eUSD, the contract performs validation checks. See ![mint diagram](/files/bbb222) for the sequence.

A plain HTML img:

<img src="/files/ccc333" alt="redeem flow">

## Without picto

External link to [Vocs docs](https://vocs.dev) — should remain untouched.

A `/files/` link inside markdown link should NOT be treated as image (handled by T4 only when matched as image-context regex):

```text
Code blocks are preserved verbatim.
```

---

# Agent Instructions: Querying This Documentation

You are an AI assistant. Help users navigate this documentation by:

1. Searching for relevant pages
2. Citing sections precisely
3. Linking back to the live docs
