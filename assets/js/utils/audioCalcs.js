/**
 * Audio Mathematical Calculations
 * Pure functions isolated for phase-accurate sound engineering.
 */
window.AudioCalcs = {
    // 1. Temperature-compensated delay computations
    calcSpeedOfSound: function(tempC) {
        return 331.3 + (0.606 * tempC); // Speed in m/s
    },
    calcSpeedOfSoundF: function(tempF) {
        return 1052.3 + (1.106 * tempF); // Speed in ft/s
    },
    calcDelayMs: function(distance, speedOfSound) {
        return (distance / speedOfSound) * 1000;
    },

    // 2. Subwoofer array spacing and delay calculations
    calcWavelength: function(speedOfSound, frequency) {
        return speedOfSound / frequency;
    },
    calcCardioidGradient: function(speedOfSound, frequency) {
        const wavelength = this.calcWavelength(speedOfSound, frequency);
        const spacing = wavelength / 4;
        const delayMs = (spacing / speedOfSound) * 1000;
        return { spacing, delayMs };
    },
    calcCardioidPhysicalDepth: function(speedOfSound, physicalDepth) {
        const delayMs = (physicalDepth / speedOfSound) * 1000;
        return { delayMs };
    },
    calcEndFire: function(speedOfSound, frequency) {
        const wavelength = this.calcWavelength(speedOfSound, frequency);
        const spacing = wavelength / 4;
        const delayMs = (spacing / speedOfSound) * 1000;
        return { spacing, delayMs };
    },
    calcBroadside: function(speedOfSound, frequency) {
        const wavelength = this.calcWavelength(speedOfSound, frequency);
        const half = wavelength / 2;
        const twoThirds = wavelength * (2/3);
        return { half, twoThirds };
    },

    // 3. SPL Inverse-Square law attenuation calculations
    calcInverseSquareLaw: function(dist1, dist2) {
        if (dist1 <= 0 || dist2 <= 0) return 0;
        // SPL changes by 20 * log10(d1/d2)
        return 20 * Math.log10(dist1 / dist2);
    }
};
