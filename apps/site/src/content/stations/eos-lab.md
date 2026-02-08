---
title: "Station card: eos-lab"
demo_slug: "eos-lab"
last_updated: "2026-02-07"
has_math: true
---
**Name:** ________________________________  **Section:** __________  **Date:** __________

**Station:** __________  **Group members:** ________________________________________________

*Goal:* Use the demo to make a claim about stellar equations of state supported by (1) at least one number/readout and (2) at least one sanity check.

> **Station card: Equation-of-State Lab (10–12 minutes)**
> **Demo setup:** Set composition to solar ($X = 0.70$, $Y = 0.28$, $Z = 0.02$). Start at the solar core defaults ($T = 1.5 \times 10^7$ K, $\rho = 150$ g cm$^{-3}$).
> **Tip:** Click **Station Mode** to add EOS anchor rows and export your data table.
>
> **Your station artifact (fill in):**
> 1) **Control(s):** temperature $T$ (K), density $\rho$ (g cm$^{-3}$), composition $X / Y / Z$
> 2) **Observable(s):** $P_\text{gas}$ (dyn cm$^{-2}$), $P_\text{rad}$ (dyn cm$^{-2}$), $P_\text{deg}$ (dyn cm$^{-2}$), dominant channel, $T / T_F$, $\chi_\text{deg}$
> 3) **Governing relationships:**
>
>    $$P_\text{gas} = \frac{\rho k_B T}{\mu m_H}, \quad P_\text{rad} = \frac{1}{3} a T^4, \quad P_\text{deg} = K \left(\frac{\rho}{\mu_e m_H}\right)^{5/3}$$
> 4) **Sanity check:** The solar core should be gas-pressure dominated ($P_\text{gas} \gg P_\text{rad}, P_\text{deg}$). A white dwarf interior ($T \sim 10^7$ K, $\rho \sim 10^6$ g cm$^{-3}$) should be degeneracy-dominated.
> 5) **Connection sentence:** "The dominant pressure channel matters for stellar structure because…"

## Data Collection Tasks (Station Mode)

1. Click **Station Mode**. Add the three **EOS anchors** using the preset buttons: **Solar core**, **Red giant core**, **White dwarf**. Three rows appear in the table.

2. **Analyze the solar core row.** Which pressure channel dominates? Compute the ratio $P_\text{rad} / P_\text{gas}$. Is the gas ideal or degenerate? (Check $T / T_F$: if $T / T_F \gg 1$, the gas is classical.)

3. **Analyze the white dwarf row.** Which pressure channel dominates now? Compute $P_\text{deg} / P_\text{gas}$. What is $T / T_F$? Describe in one sentence why this gas is qualitatively different from the solar core.

4. **Scaling experiment — temperature.** Starting from the solar core defaults, raise $T$ by one decade (to $\sim 1.5 \times 10^8$ K) while holding $\rho$ fixed. Click **Add Row**. Which pressure grew fastest? Explain why, using the exponents in the governing equations.

5. **Scaling experiment — density.** Reset to solar core defaults. Now raise $\rho$ by two decades (to $\sim 1.5 \times 10^4$ g cm$^{-3}$) while holding $T$ fixed. Click **Add Row**. Which pressure channel changed the most?

6. Click **Export** to copy the table, then paste it into your lab document.

### Data table

| Environment | $T$ (K) | $\rho$ (g cm$^{-3}$) | $P_\text{gas}$ | $P_\text{rad}$ | $P_\text{deg}$ | Dominant | $T/T_F$ |
|---|---|---|---|---|---|---|---|
| Solar core | $1.5 \times 10^7$ | 150 | | | | | |
| Red giant core | | | | | | | |
| White dwarf | | $10^6$ | | | | | |
| Expt: raise $T$ | $1.5 \times 10^8$ | 150 | | | | | |
| Expt: raise $\rho$ | $1.5 \times 10^7$ | $1.5 \times 10^4$ | | | | | |

> **Word bank**
> - **$P_\text{gas}$ (ideal gas pressure):** pressure from thermal motion of ions and electrons; $\propto \rho T$.
> - **$P_\text{rad}$ (radiation pressure):** pressure from photons; $\propto T^4$ — grows much faster than $P_\text{gas}$ with temperature.
> - **$P_\text{deg}$ (electron degeneracy pressure):** quantum-mechanical pressure from the Pauli exclusion principle; depends on density, not temperature ($\propto \rho^{5/3}$ in the non-relativistic limit).
> - **$\mu$ (mean molecular weight):** average mass per particle in units of $m_H$; depends on composition and ionization.
> - **$T_F$ (Fermi temperature):** the temperature scale where quantum degeneracy sets in; $T / T_F \gg 1$ means classical, $T / T_F \lesssim 1$ means degenerate.
> - **$\chi_\text{deg}$ (degeneracy parameter):** a dimensionless measure of how degenerate the electron gas is; related to $T / T_F$.
> - **LTE (local thermodynamic equilibrium):** the assumption that matter and radiation share a single local temperature; valid in stellar interiors.
>
> **Sanity checks:**
> - Solar core: gas-dominated, classical ($T / T_F \gg 1$), $P_\text{rad} / P_\text{gas} \sim 0.01$.
> - White dwarf: degeneracy-dominated ($P_\text{deg} \gg P_\text{gas}$), $T / T_F \lesssim 1$.
> - Raising $T$ by one decade at fixed $\rho$: $P_\text{rad}$ grows by $10^4$ while $P_\text{gas}$ grows by $10^1$.
> - Raising $\rho$ by two decades at fixed $T$: $P_\text{deg}$ grows by $10^{10/3} \approx 2{,}150\times$ while $P_\text{gas}$ grows by $10^2 = 100\times$.
