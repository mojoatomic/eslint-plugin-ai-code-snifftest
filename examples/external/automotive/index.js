module.exports = {
  domain: 'automotive',
  version: '1.0.0',
  constants: [
    { value: 0.3048, name: 'M_PER_FOOT', description: 'Meters per foot' },
    { value: 1.60934, name: 'KM_PER_MILE', description: 'Kilometers per mile (approx)' }
  ],
  terms: { entities: ['Vehicle','Engine'], properties: ['speed','rpm'], actions: ['accelerate','brake'] },
  naming: { style: 'camelCase', booleanPrefix: ['is','has','should'], constants: 'UPPER_SNAKE_CASE' }
};