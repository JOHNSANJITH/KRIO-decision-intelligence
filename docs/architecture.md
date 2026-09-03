# Krio Architecture

Krio separates prediction, scenario analysis, optimization, and policy decisions so each stage can be tested independently.

## Pipeline

```text
Data -> Validation -> Features -> Forecast + Metrics -> Scenarios -> Optimization -> Policy -> Explanation -> API -> UI
```

The first domain adapter is SaaS marketing allocation. The domain-independent concepts are represented by data structures and service boundaries rather than a single hard-coded business workflow.
