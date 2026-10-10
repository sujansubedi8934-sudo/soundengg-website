(function() {
    function initImpedanceCalculator() {
        const speakerCountEl = document.getElementById('speaker-count');
        const speakerImpedanceEl = document.getElementById('speaker-impedance');
        const speakerPowerEl = document.getElementById('speaker-power');
        const amplifierPowerEl = document.getElementById('amplifier-power');
        const amplifierImpedanceEl = document.getElementById('amplifier-impedance');
        
        const resultImpedanceEl = document.getElementById('result-total-impedance');
        const resultPowerEl = document.getElementById('result-total-power');
        const resultPowerPerSpeakerEl = document.getElementById('result-power-per-speaker');
        
        const recBox = document.getElementById('result-recommendation-box');
        const recIcon = document.getElementById('rec-icon');
        const recTitle = document.getElementById('rec-title');
        const recDescription = document.getElementById('rec-description');
        
        const modeButtons = document.querySelectorAll('.connection-mode-btn');
        const seriesParallelBtn = document.getElementById('btn-mode-series-parallel');

        if (!speakerCountEl) return; // Not on app screen

        let currentMode = 'parallel'; // default

        // Handle Mode Selection
        modeButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                modeButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentMode = btn.getAttribute('data-mode');
                calculateResults();
            });
        });

        // Event listeners for inputs
        [speakerCountEl, speakerImpedanceEl, speakerPowerEl, amplifierPowerEl, amplifierImpedanceEl].forEach(el => {
            el.addEventListener('input', () => {
                validateLayout();
                calculateResults();
            });
        });

        function validateLayout() {
            const count = parseInt(speakerCountEl.value);
            // Series-Parallel is only mathematically logical for symmetric groups of even numbers >= 4 (4, 6, 8)
            const isSeriesParallelAllowed = (count === 4 || count === 6 || count === 8);

            if (!isSeriesParallelAllowed) {
                seriesParallelBtn.disabled = true;
                seriesParallelBtn.style.opacity = '0.4';
                seriesParallelBtn.style.cursor = 'not-allowed';
                if (currentMode === 'series-parallel') {
                    // Fall back to parallel
                    currentMode = 'parallel';
                    modeButtons.forEach(b => {
                        if (b.getAttribute('data-mode') === 'parallel') b.classList.add('active');
                        else b.classList.remove('active');
                    });
                }
            } else {
                seriesParallelBtn.disabled = false;
                seriesParallelBtn.style.opacity = '1';
                seriesParallelBtn.style.cursor = 'pointer';
            }
        }

        // Calculations & Recommendation Engine
        function calculateResults() {
            const count = parseInt(speakerCountEl.value);
            const speakerImp = parseFloat(speakerImpedanceEl.value);
            const speakerPower = parseFloat(speakerPowerEl.value) || 0;
            const ampPower = parseFloat(amplifierPowerEl.value) || 0;
            const ampImp = parseFloat(amplifierImpedanceEl.value) || 8;

            // 1. Calculate specs for CURRENT active mode
            const activeResult = computeSpecs(currentMode, count, speakerImp, speakerPower, ampPower, ampImp);

            // Display results
            resultImpedanceEl.textContent = activeResult.safe ? `${activeResult.totalImpedance.toFixed(2)} Ω` : 'SHORT CIRCUIT';
            resultPowerEl.textContent = activeResult.safe ? `${Math.round(activeResult.totalPower)} W` : '0 W';
            resultPowerPerSpeakerEl.textContent = activeResult.safe 
                ? `(${Math.round(activeResult.powerPerSpeaker)} W per speaker)` 
                : '(Dangerous Load)';

            // 2. Run Recommendation Evaluation across all modes
            const modesToEvaluate = ['parallel', 'series'];
            if (count === 4 || count === 6 || count === 8) {
                modesToEvaluate.push('series-parallel');
            }

            let bestMode = null;
            let bestVerdict = '';
            let highestScore = -1;

            modesToEvaluate.forEach(mode => {
                const res = computeSpecs(mode, count, speakerImp, speakerPower, ampPower, ampImp);
                if (!res.safe) return; // Skip unsafe combinations (under 2 ohms)

                // Evaluate power ratio (sweet spot is 1.5x to 2.0x speaker RMS)
                const ratio = res.powerPerSpeaker / speakerPower;
                let score = 0;

                if (ratio >= 1.5 && ratio <= 2.0) {
                    score = 10; // Perfect match
                } else if (ratio >= 1.0 && ratio < 1.5) {
                    score = 8;  // Good match
                } else if (ratio > 2.0 && ratio <= 2.5) {
                    score = 6;  // Marginally overpowered
                } else if (ratio > 0.5 && ratio < 1.0) {
                    score = 4;  // Underpowered but working
                } else {
                    score = 1;  // Unusable or extreme mismatch
                }

                // If this is the highest scoring, pick it
                if (score > highestScore) {
                    highestScore = score;
                    bestMode = mode;
                    
                    const ratioTxt = ratio.toFixed(1);
                    const formattedMode = mode === 'parallel' ? 'Parallel' : mode === 'series' ? 'Series' : 'Series-Parallel';
                    
                    if (score === 10) {
                        bestVerdict = `Recommended Setup: <strong>${formattedMode} Wiring</strong>. It delivers <strong>${Math.round(res.powerPerSpeaker)}W per speaker</strong> (a perfect ${ratioTxt}x headroom match for your ${speakerPower}W speaker RMS) with a safe load of <strong>${res.totalImpedance.toFixed(2)} Ω</strong>.`;
                    } else if (score === 8) {
                        bestVerdict = `Recommended Setup: <strong>${formattedMode} Wiring</strong>. It delivers <strong>${Math.round(res.powerPerSpeaker)}W per speaker</strong> (${ratioTxt}x headroom match). This is a safe load of <strong>${res.totalImpedance.toFixed(2)} Ω</strong> for moderate volumes.`;
                    } else if (score === 6) {
                        bestVerdict = `Recommended Setup: <strong>${formattedMode} Wiring</strong>. It delivers <strong>${Math.round(res.powerPerSpeaker)}W per speaker</strong> (${ratioTxt}x headroom). Caution: This slightly overpowers your cabinets, monitor volume limits.`;
                    } else if (score === 4) {
                        bestVerdict = `Recommended Setup: <strong>${formattedMode} Wiring</strong> to maintain a safe load of <strong>${res.totalImpedance.toFixed(2)} Ω</strong>, though it will slightly underpower your speakers (${ratioTxt}x match). Avoid driving the amp into clipping.`;
                    } else {
                        bestVerdict = `Setup: <strong>${formattedMode} Wiring</strong> is the safest configuration (${res.totalImpedance.toFixed(2)} Ω), though power matching is poor (${ratioTxt}x).`;
                    }
                }
            });
            // Update Recommendation Alert UI
            const activeRatio = speakerPower > 0 ? (activeResult.powerPerSpeaker / speakerPower) : 0;

            if (activeResult.totalImpedance < 2.0) {
                // DANGER: IMPEDANCE TOO LOW
                recBox.style.background = 'rgba(239, 68, 68, 0.1)';
                recBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                recIcon.textContent = 'warning';
                recIcon.style.color = '#ef4444';
                recTitle.textContent = 'DANGER: DANGEROUS LOAD!';
                recTitle.style.color = '#ef4444';
                recDescription.innerHTML = `This wiring mode drops your total impedance load to <strong>${activeResult.totalImpedance.toFixed(2)} Ω</strong>. <strong>DO NOT RUN THIS SETUP!</strong> Most standard professional amplifiers will overheat, go into thermal protect mode, or suffer hardware damage. ${bestMode ? '<br><br>💡 ' + bestVerdict : ''}`;
            } else if (speakerPower > 0 && ampPower > 0 && activeRatio > 2.5) {
                // DANGER: EXTREME OVERPOWERING / SPEAKER BLOWOUT RISK
                recBox.style.background = 'rgba(239, 68, 68, 0.1)';
                recBox.style.border = '1px solid rgba(239, 68, 68, 0.3)';
                recIcon.textContent = 'warning';
                recIcon.style.color = '#ef4444';
                recTitle.textContent = 'DANGER: SPEAKER BLOWOUT RISK!';
                recTitle.style.color = '#ef4444';
                recDescription.innerHTML = `The amplifier is delivering <strong>${Math.round(activeResult.powerPerSpeaker)}W per speaker</strong>, which is <strong>${activeRatio.toFixed(1)}x</strong> the speaker's RMS rating of <strong>${speakerPower}W</strong>. This extreme power mismatch will likely destroy the speaker voice coils. Use a lower power amplifier or add more speaker cabinets to distribute the load safely. ${bestMode ? '<br><br>💡 ' + bestVerdict : ''}`;
            } else if (activeResult.totalImpedance === 2.0) {
                // CAUTION: 2.0 OHM LOAD
                recBox.style.background = 'rgba(245, 158, 11, 0.1)';
                recBox.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                recIcon.textContent = 'info';
                recIcon.style.color = '#f59e0b';
                recTitle.textContent = 'CAUTION: 2.0 Ω LOAD';
                recTitle.style.color = '#f59e0b';
                let powerWarning = '';
                if (speakerPower > 0 && ampPower > 0) {
                    if (activeRatio > 2.0) {
                        powerWarning = `<br><span style="color: #f59e0b; font-weight: bold;">[Warning]</span> Speaker is also overpowered by <strong>${activeRatio.toFixed(1)}x</strong>.`;
                    } else if (activeRatio < 0.4) {
                        powerWarning = `<br><span style="color: #f59e0b; font-weight: bold;">[Warning]</span> Speaker is also underpowered by <strong>${activeRatio.toFixed(1)}x</strong>.`;
                    }
                }
                recDescription.innerHTML = `Your load impedance is <strong>2.00 Ω</strong>. Verify that your amplifier spec sheet explicitly states it is "stable down to 2 Ω" before running this system. Otherwise, use a higher impedance wiring setup.${powerWarning}<br><br>💡 ${bestVerdict}`;
            } else if (speakerPower > 0 && ampPower > 0 && activeRatio > 2.0 && activeRatio <= 2.5) {
                // CAUTION: OVERPOWERED
                recBox.style.background = 'rgba(245, 158, 11, 0.1)';
                recBox.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                recIcon.textContent = 'info';
                recIcon.style.color = '#f59e0b';
                recTitle.textContent = 'CAUTION: OVERPOWERED SETUP';
                recTitle.style.color = '#f59e0b';
                recDescription.innerHTML = `The amplifier is delivering <strong>${Math.round(activeResult.powerPerSpeaker)}W per speaker</strong> (${activeRatio.toFixed(1)}x RMS). This exceeds the optimal 1.5x - 2.0x headroom sweet spot. Monitor volume limits closely to prevent thermal damage.<br><br>💡 ${bestVerdict}`;
            } else if (speakerPower > 0 && ampPower > 0 && activeRatio < 0.4) {
                // CAUTION: UNDERPOWERED
                recBox.style.background = 'rgba(245, 158, 11, 0.1)';
                recBox.style.border = '1px solid rgba(245, 158, 11, 0.3)';
                recIcon.textContent = 'info';
                recIcon.style.color = '#f59e0b';
                recTitle.textContent = 'CAUTION: UNDERPOWERED SETUP';
                recTitle.style.color = '#f59e0b';
                recDescription.innerHTML = `The amplifier is delivering only <strong>${Math.round(activeResult.powerPerSpeaker)}W per speaker</strong> (${activeRatio.toFixed(2)}x RMS). This is significantly below the speaker's rating of <strong>${speakerPower}W</strong>. Avoid pushing the amplifier hard to prevent signal clipping, which will damage speaker high-frequency drivers.<br><br>💡 ${bestVerdict}`;
            } else {
                // SAFE
                recBox.style.background = 'rgba(16, 185, 129, 0.1)';
                recBox.style.border = '1px solid rgba(16, 185, 129, 0.3)';
                recIcon.textContent = 'check_circle';
                recIcon.style.color = '#10b981';
                recTitle.textContent = 'SYSTEM SAFE & BALANCED';
                recTitle.style.color = '#10b981';
                let powerMatchText = '';
                if (speakerPower > 0 && ampPower > 0) {
                    powerMatchText = ` and power match is safe (<strong>${activeRatio.toFixed(1)}x</strong> headroom match)`;
                }
                recDescription.innerHTML = `Total load is <strong>${activeResult.totalImpedance.toFixed(2)} Ω</strong>${powerMatchText}. ${bestMode ? '<br><br>💡 ' + bestVerdict : ''}`;
            }
        }

        // Calculation Helper
        function computeSpecs(mode, count, speakerImp, speakerPower, ampPower, ampImp) {
            let totalImpedance = 8;
            
            if (mode === 'parallel') {
                totalImpedance = speakerImp / count;
            } else if (mode === 'series') {
                totalImpedance = speakerImp * count;
            } else if (mode === 'series-parallel') {
                // Standard symmetric splits:
                // 4 cabs: 2S x 2P = R
                // 6 cabs: 3S x 2P = 1.5R
                // 8 cabs: 4S x 2P = 2R
                if (count === 4) totalImpedance = speakerImp;
                else if (count === 6) totalImpedance = speakerImp * 1.5;
                else if (count === 8) totalImpedance = speakerImp * 2.0;
            }

            const safe = (totalImpedance >= 1.5); // Under 1.5 ohm is short circuit hazard

            // Calculate delivered power based on amplifier specifications
            // P_delivered = V^2 / R_load. First calculate V_rms from amplifier specs:
            const vRms = Math.sqrt(ampPower * ampImp);
            
            // Deliver power to the load
            let totalPower = (vRms * vRms) / totalImpedance;
            
            // Realistic limitation check: standard amplifiers cannot supply infinite current.
            // Power at 2 ohms rarely exceeds 2x the 8 ohm rating due to power supply current clipping.
            // We scale the ceiling power limit to 2.5x the rated power to remain realistic.
            const maximumAmpCurrentCeiling = ampPower * 2.5;
            if (totalPower > maximumAmpCurrentCeiling) {
                totalPower = maximumAmpCurrentCeiling;
            }

            const powerPerSpeaker = totalPower / count;

            return {
                totalImpedance,
                totalPower,
                powerPerSpeaker,
                safe
            };
        }

        // --- Share Config Button (#btn-share-impedance) ---
        const btnShareImp = document.getElementById('btn-share-impedance');
        if (btnShareImp) {
            btnShareImp.addEventListener('click', (e) => {
                if (e) e.preventDefault();
                calculateResults();

                const count = parseInt(speakerCountEl.value, 10) || 2;
                const speakerImp = parseFloat(speakerImpedanceEl.value) || 8;
                const speakerPower = parseFloat(speakerPowerEl.value) || 400;
                const ampPower = parseFloat(amplifierPowerEl.value) || 1000;
                const ampImp = parseFloat(amplifierImpedanceEl.value) || 8;
                const activeResult = computeSpecs(currentMode, count, speakerImp, speakerPower, ampPower, ampImp);

                const modeLabel = currentMode === 'parallel' ? 'Parallel Wiring' : currentMode === 'series' ? 'Series Wiring' : 'Series-Parallel Wiring';
                const totalImpTxt = activeResult.safe ? `${activeResult.totalImpedance.toFixed(2)} Ω` : `${activeResult.totalImpedance.toFixed(2)} Ω (SHORT CIRCUIT HAZARD)`;
                const totalPowTxt = activeResult.safe ? `${Math.round(activeResult.totalPower)} W` : `0 W (Unsafe Load)`;
                const perSpeakerTxt = activeResult.safe ? `${Math.round(activeResult.powerPerSpeaker)} W / cabinet` : `Dangerous Load`;
                const verdictTitle = recTitle ? recTitle.textContent : 'System Evaluated';
                const verdictText = recDescription ? recDescription.textContent.replace(/\s+/g, ' ').trim() : '';

                const baseUrl = typeof window.getPublicAppUrl === 'function'
                    ? window.getPublicAppUrl()
                    : 'https://www.soundengg.com/app.html';
                const shareUrl = `${baseUrl}?view=impedance&mode=${encodeURIComponent(currentMode)}&count=${count}&simp=${speakerImp}&spow=${speakerPower}&apow=${ampPower}&aimp=${ampImp}`;

                const reportStr = [
                    `SoundEngg Speaker Impedance & Power Matching Report`,
                    `• Wiring Mode: ${modeLabel}`,
                    `• Speakers: ${count}x ${speakerImp} Ω Cabinets (${speakerPower} W RMS each)`,
                    `• Amplifier Rating: ${ampPower} W @ ${ampImp} Ω`,
                    `• Total System Load: ${totalImpTxt}`,
                    `• Delivered Power: ${totalPowTxt} (${perSpeakerTxt})`,
                    `• Verdict: ${verdictTitle}${verdictText ? ' — ' + verdictText : ''}`,
                    `• Interactive Config: ${shareUrl}`
                ].join('\n');

                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(reportStr).then(() => {
                        if (typeof window.showSoundEnggToast === 'function') {
                            window.showSoundEnggToast('✓ Copied Impedance & Power Report & Link!');
                        } else {
                            alert(reportStr);
                        }
                    }).catch(() => {
                        alert(reportStr);
                    });
                } else {
                    alert(reportStr);
                }
            });
        }

        // --- Restore Shared Config from URL Query Params ---
        const urlParams = new URLSearchParams(window.location.search);
        const viewParam = (urlParams.get('view') || '').toLowerCase();
        if (viewParam === 'impedance' || viewParam === 'speakerimpedance') {
            const countQ = urlParams.get('count');
            const simpQ = urlParams.get('simp');
            const spowQ = urlParams.get('spow');
            const apowQ = urlParams.get('apow');
            const aimpQ = urlParams.get('aimp');
            const modeQ = urlParams.get('mode');

            if (countQ && speakerCountEl) speakerCountEl.value = countQ;
            if (simpQ && speakerImpedanceEl) speakerImpedanceEl.value = simpQ;
            if (spowQ && speakerPowerEl) speakerPowerEl.value = parseFloat(spowQ);
            if (apowQ && amplifierPowerEl) amplifierPowerEl.value = parseFloat(apowQ);
            if (aimpQ && amplifierImpedanceEl) amplifierImpedanceEl.value = aimpQ;
            if (modeQ === 'parallel' || modeQ === 'series' || modeQ === 'series-parallel') {
                currentMode = modeQ;
                modeButtons.forEach(b => {
                    b.classList.toggle('active', b.getAttribute('data-mode') === currentMode);
                });
            }
        }

        // Initialize state
        validateLayout();
        calculateResults();
    }

    // Bind to window for main.js lifecycle
    window.initImpedanceCalculator = initImpedanceCalculator;
})();
