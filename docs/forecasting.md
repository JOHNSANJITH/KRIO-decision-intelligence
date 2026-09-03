# Forecasting

Forecasting uses time-derived features and chronological holdout validation.

Models currently compared:

- Linear regression
- Random forest regression

Selection metric:

- WAPE

The feature pipeline uses lagged values, rolling means, growth rates, and month information. The model does not use future observations when constructing historical features.
