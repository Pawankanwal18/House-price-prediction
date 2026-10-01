const API_BASE = '/api';

export class ApiError extends Error {
  constructor(message, fields = {}) { super(message); this.fields = fields; }
}

export function validPrediction(data) {
  return data && Number.isFinite(data.predicted_price) && data.predicted_price > 0 && data.currency === 'USD'
    && typeof data.model_version === 'string' && typeof data.disclaimer === 'string'
    && data.features && typeof data.features === 'object' && !Array.isArray(data.features)
    && ['area', 'lot_area', 'bedrooms', 'full_baths', 'half_baths', 'property_age', 'garage_cars'].every(k => Number.isFinite(data.features[k]))
    && ['neighborhood', 'house_style', 'central_air'].every(k => typeof data.features[k] === 'string');
}

export function validMetadata(data) {
  return data && data.schema_version === 1 && typeof data.model_version === 'string'
    && Number.isFinite(data.training_median_price) && data.training_median_price > 0
    && typeof data.disclaimer === 'string' && Array.isArray(data.fields) && data.fields.length === 10
    && data.fields.every(f => typeof f.name === 'string' && typeof f.label === 'string'
      && (f.type === 'category' ? Array.isArray(f.options) && f.options.length > 0
        && f.options.every(o => typeof o.value === 'string' && typeof o.label === 'string')
        && f.options.some(o => o.value === f.default)
        : f.type === 'number' && [f.min, f.max, f.step, f.default].every(Number.isFinite) && f.step > 0 && f.min <= f.default && f.default <= f.max));
}

export function validMetrics(data) {
  return data && ['mae', 'mse', 'rmse', 'r2', 'rows', 'train_rows', 'test_rows'].every(k => Number.isFinite(data[k]))
    && Array.isArray(data.points) && data.points.length > 0 && data.points.every(p => Number.isFinite(p.actual) && Number.isFinite(p.predicted))
    && Array.isArray(data.coefficients) && data.coefficients.every(c => typeof c.feature === 'string' && Number.isFinite(c.value))
    && data.baselines && typeof data.coefficient_note === 'string';
}

async function request(path, options = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${API_BASE}${path}`, { ...options, signal: controller.signal, headers: { 'Content-Type': 'application/json', ...options.headers } });
    let data;
    try { data = await response.json(); } catch { throw new ApiError('The service returned an unexpected response. Please try again.'); }
    if (!response.ok) {
      const message = response.status === 400 ? 'Please check your property details.'
        : response.status === 422 ? 'This combination falls outside a useful estimate. Please check the property details.'
          : response.status === 503 ? 'The model is temporarily unavailable. Please try again later.'
            : 'We could not complete your request. Please try again.';
      const fields = data.fields && typeof data.fields === 'object'
        ? Object.fromEntries(Object.entries(data.fields).filter(([, value]) => typeof value === 'string')) : {};
      throw new ApiError(message, fields);
    }
    const valid = path === '/predict' ? validPrediction(data) : path === '/metadata' ? validMetadata(data) : validMetrics(data);
    if (!valid) throw new ApiError('The service returned incomplete data. Please try again.');
    return data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error.name === 'AbortError' ? 'The request took too long. Please try again.' : 'Unable to reach the service. Check your connection and try again.');
  } finally { clearTimeout(timeout); }
}

export const getMetadata = () => request('/metadata');
export const getMetrics = () => request('/metrics');
export const predictPrice = features => request('/predict', { method: 'POST', body: JSON.stringify(features) });

export function validateForm(values, fields) {
  const errors = {};
  for (const field of fields) {
    const value = values[field.name];
    if (value === '' || value === undefined || value === null) errors[field.name] = 'This field is required.';
    else if (field.type === 'category') {
      if (!field.options.some(option => option.value === value)) errors[field.name] = 'Please select a supported option.';
    } else if (!Number.isFinite(Number(value)) || Number(value) < field.min || Number(value) > field.max || Number(value) % field.step !== 0) {
      errors[field.name] = `Enter a whole number from ${field.min.toLocaleString()} to ${field.max.toLocaleString()}.`;
    }
  }
  return errors;
}

export const money = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
export const compactMoney = value => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact', maximumFractionDigits: 0 }).format(value);
export function displayFeature(field, value) {
  return field.type === 'category' ? field.options.find(o => o.value === value)?.label ?? value
    : `${Number(value).toLocaleString('en-US')}${field.unit ? ` ${field.unit}` : ''}`;
}
