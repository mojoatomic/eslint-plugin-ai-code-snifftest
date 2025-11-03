module.exports = {
  domain: 'medical',
  version: '1.0.0',
  constants: [
    { value: 37.0, name: 'NORMAL_BODY_TEMP_C', description: 'Normal body temperature (Celsius)' },
    { value: 98.6, name: 'NORMAL_BODY_TEMP_F', description: 'Normal body temperature (Fahrenheit)' }
  ],
  terms: { entities: ['Patient','Diagnosis'], properties: ['bloodPressure','heartRate'], actions: ['diagnose','treat'] },
  naming: { style: 'camelCase', booleanPrefix: ['is','has','should'], constants: 'UPPER_SNAKE_CASE' }
};