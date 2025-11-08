'use strict';

module.exports = Object.freeze({
  constants: [
    // Periods, cycles, etc.
    365.25, // days in year (approx)
    29.53059, // synodic month (days)
    27.32166, // sidereal month (days)
    27.55455, // anomalistic month (days)
    27.21222, // draconic month (days)
  ],
  // Optional metadata for friendly names/descriptions
  constantMeta: [
    { value: 365.25, name: 'TROPICAL_YEAR_DAYS', description: 'Mean tropical year in days' },
    { value: 29.53059, name: 'SYNODIC_MONTH_DAYS', description: 'Lunar synodic month in days' },
    { value: 27.32166, name: 'SIDEREAL_MONTH_DAYS', description: 'Moon sidereal month in days' },
    { value: 23.43, name: 'EARTH_AXIAL_TILT_DEG', description: 'Obliquity of the ecliptic (deg, approx)' }
  ],
  terms: [
    'longitude','latitude','ecliptic','equinox','solstice','aphelion','perihelion','ascending','descending','node',
    'orbital','orbit','kepler','ephemeris','elements','saros','metonic','draconic','anomalistic','sidereal','synodic','tropical',
    'motion','velocity','acceleration','angular','epoch','julian','angle','rotation','degree','azimuth'
  ]
});