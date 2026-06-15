function initAuthSystem() {
    // GLOBAL AUTH ICON DELEGATION
    document.addEventListener('click', async (e) => {
        const authBtn = e.target.closest('.auth-toggle-btn');
        if (authBtn) {
            e.preventDefault();
            
            // Auto close mobile menu on selection
            const menu = document.getElementById('mobile-nav-dropdown-menu');
            const toggleBtn = document.getElementById('btn-mobile-nav-toggle');
            if (menu) menu.style.display = 'none';
            if (toggleBtn) toggleBtn.classList.remove('active');
            
            console.log('Global Auth Icon Triggered');
            
            if (!window.supabaseClient) {
                alert('Connection error. Please refresh.');
                return;
            }

            const iconSpan = authBtn.querySelector('.material-symbols-outlined');
            const isUserIcon = iconSpan && iconSpan.textContent === 'account_circle';

            if (isUserIcon) {
                const profileModal = document.getElementById('profile-modal');
                openModal(profileModal);
                
                // Fetch and populate latest profile details and billing ledger in real-time on modal open!
                if (window.supabaseClient) {
                    window.supabaseClient.auth.getSession().then(async ({ data: { session } }) => {
                        if (session) {
                            try {
                                await syncSubscriptionStatus(session);
                                console.log('Real-time subscription status and profile details fully synced on modal open.');
                            } catch (err) {
                                console.error('Error syncing profile on open:', err);
                            }
                        }
                    });
                }
            } else {
                openModal(document.getElementById('auth-modal-overlay'));
            }

            // Perform background session check to correct UI if needed
            window.supabaseClient.auth.getSession().then(({ data: { session } }) => {
                if (!session && isUserIcon) {
                    // Oops, icon was wrong, user is actually logged out
                    const profileModal = document.getElementById('profile-modal');
                    if (profileModal) closeModal(profileModal);
                    const authModal = document.getElementById('auth-modal-overlay');
                    if (authModal) authModal.classList.remove('hidden');
                }
            });
        }
    });
    
    // --- UNIFIED AUTHENTICATION MANAGER (Senior Consolidation) ---
    function handleAuthStateChange(event, session) {
        // Decouple execution asynchronously to prevent GoTrue thread/lock deadlocks
        setTimeout(async () => {
            console.group(`Auth Event: ${event}`);
            try {
                const user = session?.user;
                const authModalOverlay = document.getElementById('auth-modal-overlay');
                const profileModal = document.getElementById('profile-modal');

                // A. Close modals immediately on auth state change (Senior UI Snappiness)
                if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') {
                    if (authModalOverlay) closeModal(authModalOverlay);
                    if (profileModal) closeModal(profileModal);
                }

                // B. Sync Pro/Free State and Profile Data in background (does not block UI/modals)
                try {
                    await syncSubscriptionStatus(session);
                } catch (syncErr) {
                    console.error('[handleAuthStateChange] Background syncSubscriptionStatus failed:', syncErr);
                }

                // C. Global UI Update (Icon, Text)
                const btnAuthToggles = document.querySelectorAll('.auth-toggle-btn');
                btnAuthToggles.forEach(btnAuthToggle => {
                    const authText = btnAuthToggle.querySelector('.btn-text');
                    const authIcon = btnAuthToggle.querySelector('.material-symbols-outlined');
                    
                    if (user) {
                        const name = user.user_metadata?.full_name || user.email.split('@')[0].toUpperCase();
                        safeStorage.setItem('soundengg_user_display_name', name);
                        if (authText) authText.textContent = name;
                        if (authIcon) authIcon.textContent = 'account_circle';
                        btnAuthToggle.classList.add('logged-in');
                    } else {
                        safeStorage.removeItem('soundengg_user_display_name');
                        if (authText) {
                            authText.textContent = btnAuthToggle.classList.contains('mobile-dropdown-btn') ? 'LOGIN/SIGNUP' : 'LOG IN';
                        }
                        if (authIcon) authIcon.textContent = 'login';
                        btnAuthToggle.classList.remove('logged-in', 'active');
                    }
                });

                // D. Signal Modules to refresh data
                if (event === 'SIGNED_IN') {
                    document.dispatchEvent(new CustomEvent('authSuccess', { detail: session }));
                    console.log('Global authSuccess signal dispatched');
                }
                if (event === 'SIGNED_OUT') {
                    document.dispatchEvent(new CustomEvent('authCleared'));
                    console.log('Global authCleared signal dispatched');
                }
            } catch (err) {
                console.error('[handleAuthStateChange] Error in callback:', err);
            } finally {
                console.groupEnd();
            }
        }, 0);
    }

    if (window.supabaseClient) {
        window.supabaseClient.auth.onAuthStateChange(handleAuthStateChange);
        // Run once on init (Senior Fix: always trigger to sync UI even if logged out)
        window.supabaseClient.auth.getSession().then(({data}) => {
            handleAuthStateChange('INITIAL_SESSION', data.session);
        });

        // Safari Back-Forward Cache (bfcache) wake-up fix
        window.addEventListener('pageshow', (event) => {
            window.supabaseClient.auth.getSession().then(({data}) => {
                handleAuthStateChange('INITIAL_SESSION', data.session);
            });
        });

        // Capacitor Native App Deep Link Handler for Google OAuth Callback
        if (typeof window.isNativeMobile === 'function' && window.isNativeMobile()) {
            const AppPlugin = window.Capacitor?.Plugins?.App;
            if (AppPlugin) {
                const handleDeepLink = async (urlStr) => {
                    if (!urlStr) return;
                    console.log('[NativeDeepLink] Received url:', urlStr);
                    if (urlStr.includes('login-callback')) {
                        try {
                            const BrowserPlugin = window.Capacitor?.Plugins?.Browser;
                            if (BrowserPlugin && typeof BrowserPlugin.close === 'function') {
                                console.log('[NativeDeepLink] Dismissing OAuth Browser Custom Tab...');
                                await BrowserPlugin.close();
                            }
                        } catch (closeErr) {
                            console.error('[NativeDeepLink] Error closing Browser Custom Tab:', closeErr);
                        }

                        try {
                            // Normalize custom scheme to standard URL structure for parsing
                            const normalizedUrl = urlStr.replace('soundengg://login-callback', 'https://www.soundengg.com');
                            const parsedUrl = new URL(normalizedUrl);
                            const hash = parsedUrl.hash;
                            if (hash) {
                                const params = new URLSearchParams(hash.substring(1));
                                const accessToken = params.get('access_token');
                                const refreshToken = params.get('refresh_token');

                                if (accessToken && refreshToken && window.supabaseClient) {
                                    console.log('[NativeDeepLink] Found session tokens, activating session...');
                                    const { data, error } = await window.supabaseClient.auth.setSession({
                                        access_token: accessToken,
                                        refresh_token: refreshToken
                                    });

                                    if (error) {
                                        console.error('[NativeDeepLink] Failed to activate session:', error);
                                        alert('Session recovery failed: ' + error.message);
                                    } else {
                                        console.log('[NativeDeepLink] Session successfully activated!', data);
                                    }
                                }
                            }
                        } catch (err) {
                            console.error('[NativeDeepLink] Error handling deep link callback:', err);
                        }
                    }
                };

                // Event listener when app is already running/in background
                AppPlugin.addListener('appUrlOpen', async (data) => {
                    if (data && data.url) {
                        await handleDeepLink(data.url);
                    }
                });

                // Check if app was launched via deep link from closed state
                AppPlugin.getLaunchUrl().then(async (result) => {
                    if (result && result.url) {
                        console.log('[NativeDeepLink] Cold launch URL detected:', result.url);
                        await handleDeepLink(result.url);
                    }
                }).catch(err => {
                    console.error('[NativeDeepLink] Error retrieving launch URL:', err);
                });
            }
        }
    }
};

async function syncSubscriptionStatus(session) {
    if (!window.supabaseClient) return;
    if (!session) {
        window.isUserPro = false;
        if (window.updatePremiumUI) window.updatePremiumUI();
        document.dispatchEvent(new CustomEvent('proStatusChanged', { detail: false }));
        return;
    }

    try {
        const user = session.user;
        if (user) {
            const emailDisplay = document.getElementById('profile-email-display');
            if (emailDisplay) emailDisplay.textContent = user.email;
        }

        // Try to fetch securely with a resilient retry loop to eliminate the JWT/RLS timing race condition.
        // We query the database up to 4 times (spaced 200ms apart) to allow session headers to fully register.
        // We do not need the client-side defensive insert because the database trigger 'handle_new_user'
        // already guarantees that every active user has an associated row in 'public.profiles'.
        let data = null;
        let error = null;

        for (let attempt = 1; attempt <= 4; attempt++) {
            const response = await window.supabaseClient
                .from('profiles')
                .select('is_pro, subscription_tier, subscription_expires_at, subscription_provider, subscription_id, full_name, company, device_ids')
                .eq('id', session.user.id)
                .maybeSingle();
            
            data = response.data;
            error = response.error;

            if (data) {
                console.log(`[syncSubscriptionStatus] Profile successfully loaded on attempt ${attempt}/4.`);
                break;
            }

            // Omission Fallback: If device_ids column does not exist in user's Supabase DB, fetch all other fields cleanly
            if (error && (error.code === '42703' || error.message.includes('not found') || error.message.includes('column'))) {
                console.warn('[syncSubscriptionStatus] Column error detected. Retrying profile fetch without device_ids...');
                const responseNoDevices = await window.supabaseClient
                    .from('profiles')
                    .select('is_pro, subscription_tier, subscription_expires_at, subscription_provider, subscription_id, full_name, company')
                    .eq('id', session.user.id)
                    .maybeSingle();
                
                if (responseNoDevices.data) {
                    data = responseNoDevices.data;
                    error = null;
                    console.log(`[syncSubscriptionStatus] Profile loaded successfully without device_ids on attempt ${attempt}/4.`);
                    break;
                }
            }

            if (attempt < 4) {
                console.warn(`[syncSubscriptionStatus] Profile fetch returned empty (attempt ${attempt}/4). Retrying in 200ms...`);
                await new Promise(r => setTimeout(r, 200));
            }
        }

        // Defensive creation of profile row on the fly if it does not exist in public.profiles
        if (!data) {
            console.log('[syncSubscriptionStatus] Profile row not found in database. Creating defensively on the fly...');
            try {
                const defaultProfile = {
                    id: session.user.id,
                    email: session.user.email,
                    is_pro: false,
                    subscription_tier: 'free',
                    full_name: 'EMPTY',
                    company: 'EMPTY'
                };
                const { error: insertErr } = await window.supabaseClient
                    .from('profiles')
                    .insert([defaultProfile]);
                
                if (!insertErr) {
                    console.log('[syncSubscriptionStatus] Profile row successfully created client-side.');
                    data = defaultProfile;
                } else {
                    console.warn('[syncSubscriptionStatus] Client-side profile insert error:', insertErr.message);
                }
            } catch (insertEx) {
                console.error('[syncSubscriptionStatus] Exception during client-side profile creation:', insertEx);
            }
        }

        if (error && !data) {
            console.warn('Profile fetch error (might be schema cache):', error.message);
            // Ultra Fallback: try fetching just is_pro if everything else fails
            const { data: fallbackData } = await window.supabaseClient
                .from('profiles')
                .select('is_pro')
                .eq('id', session.user.id)
                .maybeSingle();
            if (fallbackData) {
                window.isUserPro = !!fallbackData.is_pro;
                data = { is_pro: fallbackData.is_pro };
            }
        }

        if (data) {
            // Check device limits (Max 3 concurrent devices)
            let deviceIds = data.device_ids || [];
            if (!Array.isArray(deviceIds)) {
                try {
                    deviceIds = typeof deviceIds === 'string' ? JSON.parse(deviceIds) : [];
                } catch(e) {
                    deviceIds = [];
                }
            }
            
            let currentClientId = safeStorage.getItem('soundengg_device_id');
            if (!currentClientId) {
                currentClientId = 'dev_' + Math.random().toString(36).substring(2, 15) + '_' + Date.now().toString(36);
                safeStorage.setItem('soundengg_device_id', currentClientId);
            }
            
            const meta = getDeviceMetadata();
            const currentDeviceStr = `${currentClientId}|${meta.os}|${meta.browser}|${Date.now()}`;
            
            const findDeviceIndex = (list, clientId) => {
                return list.findIndex(item => item.split('|')[0] === clientId);
            };
            const existingIdx = findDeviceIndex(deviceIds, currentClientId);
            
            if (data.hasOwnProperty('device_ids') && existingIdx === -1) {
                if (deviceIds.length < 3) {
                    deviceIds.push(currentDeviceStr);
                    try {
                        const { error: devUpdateErr } = await window.supabaseClient
                            .from('profiles')
                            .update({ device_ids: deviceIds })
                            .eq('id', session.user.id);
                        if (devUpdateErr) throw devUpdateErr;
                    } catch (e) {
                        console.warn('[syncSubscriptionStatus] Bypassing device_ids update due to missing column:', e.message);
                    }
                } else {
                    // Trigger instant session lock overlay
                    const deviceLimitModal = document.getElementById('device-limit-modal');
                    const deviceListContainer = document.getElementById('device-limit-list');
                    const errDisplay = document.getElementById('device-limit-error');
                    
                    if (deviceLimitModal) {
                        deviceLimitModal.classList.remove('hidden');
                        deviceLimitModal.style.display = 'flex';
                    }
                    
                    // Render Device List for Selective Deauthorization
                    if (deviceListContainer) {
                        deviceListContainer.innerHTML = '';
                        
                        deviceIds.forEach((devStr) => {
                            const dev = parseDeviceString(devStr);
                            if (!dev) return;
                            
                            const item = document.createElement('div');
                            item.style.cssText = `
                                display: flex;
                                justify-content: space-between;
                                align-items: center;
                                background: rgba(255, 255, 255, 0.03);
                                border: 1px solid rgba(255, 255, 255, 0.08);
                                padding: 0.75rem 1rem;
                                border-radius: 6px;
                                margin-bottom: 0.5rem;
                            `;
                            
                            const details = document.createElement('div');
                            details.style.cssText = `
                                display: flex;
                                flex-direction: column;
                                text-align: left;
                            `;
                            
                            const name = document.createElement('span');
                            name.style.cssText = 'font-weight: bold; font-size: 0.9rem; color: #fff;';
                            name.textContent = `${dev.browser} on ${dev.os}`;
                            
                            const activeTime = document.createElement('span');
                            activeTime.style.cssText = 'font-size: 0.75rem; color: var(--text-dim); margin-top: 0.2rem;';
                            activeTime.textContent = `Last Active: ${new Date(dev.lastActive).toLocaleString()}`;
                            
                            details.appendChild(name);
                            details.appendChild(activeTime);
                            
                            const deauthBtn = document.createElement('button');
                            deauthBtn.className = 'rugged-btn-sm';
                            deauthBtn.style.cssText = 'background: #ff3333; color: #fff; border: none; padding: 6px 12px; font-size: 0.75rem; font-weight: bold; border-radius: 4px; cursor: pointer;';
                            deauthBtn.textContent = 'DEAUTHORIZE';
                            
                            deauthBtn.onclick = async () => {
                                deauthBtn.disabled = true;
                                deauthBtn.textContent = 'WAIT...';
                                if (errDisplay) errDisplay.style.display = 'none';
                                
                                try {
                                    // Remove selected device, append current device metadata
                                    const updatedDevices = deviceIds
                                        .filter(d => d.split('|')[0] !== dev.id);
                                    updatedDevices.push(currentDeviceStr);
                                    
                                    const { error: updateErr } = await window.supabaseClient
                                        .from('profiles')
                                        .update({ device_ids: updatedDevices })
                                        .eq('id', session.user.id);
                                        
                                    if (updateErr) throw updateErr;
                                    
                                    // Success: Hide and reload
                                    if (deviceLimitModal) deviceLimitModal.classList.add('hidden');
                                    window.location.reload();
                                } catch (err) {
                                    console.error('[syncSubscriptionStatus] Selective deauth failed:', err.message);
                                    deauthBtn.disabled = false;
                                    deauthBtn.textContent = 'DEAUTHORIZE';
                                    if (errDisplay) {
                                        errDisplay.textContent = 'Failed to deauthorize device: ' + err.message;
                                        errDisplay.style.display = 'block';
                                    }
                                }
                            };
                            
                            item.appendChild(details);
                            item.appendChild(deauthBtn);
                            deviceListContainer.appendChild(item);
                        });
                    }
                    
                    // Wire dynamic deauthorize-all button
                    const btnDeauthorizeAll = document.getElementById('btn-device-limit-deauthorize-all');
                    if (btnDeauthorizeAll) {
                        btnDeauthorizeAll.onclick = async () => {
                            btnDeauthorizeAll.disabled = true;
                            btnDeauthorizeAll.innerHTML = '<span class="material-symbols-outlined" style="animation: spin 1s linear infinite;">sync</span> DEAUTHORIZING ALL...';
                            if (errDisplay) errDisplay.style.display = 'none';
                            
                            try {
                                const { error: devUpdateErr } = await window.supabaseClient
                                    .from('profiles')
                                    .update({ device_ids: [currentDeviceStr] })
                                    .eq('id', session.user.id);
                                    
                                if (devUpdateErr) throw devUpdateErr;
                                
                                if (deviceLimitModal) deviceLimitModal.classList.add('hidden');
                                window.location.reload();
                            } catch (e) {
                                console.error('[syncSubscriptionStatus] Deauthorize-all failed:', e.message);
                                btnDeauthorizeAll.disabled = false;
                                btnDeauthorizeAll.textContent = 'DEAUTHORIZE ALL OTHER DEVICES';
                                if (errDisplay) {
                                    errDisplay.textContent = 'Failed to reset sessions: ' + e.message;
                                    errDisplay.style.display = 'block';
                                }
                            }
                        };
                    }
                    
                    // Wire dynamic logout button
                    const btnDeviceLogout = document.getElementById('btn-device-limit-logout');
                    if (btnDeviceLogout) {
                        btnDeviceLogout.onclick = async () => {
                            try {
                                if (deviceLimitModal) deviceLimitModal.classList.add('hidden');
                                await window.supabaseClient.auth.signOut();
                                window.location.reload();
                            } catch (signOutErr) {
                                console.warn('[syncSubscriptionStatus] Manual device-limit signOut failed:', signOutErr);
                                window.location.reload();
                            }
                        };
                    }
                    
                    window.isUserPro = false;
                    if (window.updatePremiumUI) window.updatePremiumUI();
                    return;
                }
            }

            const now = new Date();
            const expiresAt = (data.subscription_expires_at && data.subscription_expires_at !== 'null') ? new Date(data.subscription_expires_at) : null;
            const isExpired = expiresAt && !isNaN(expiresAt.getTime()) && expiresAt < now;

            const isTierPro = data.subscription_tier && data.subscription_tier !== 'free';
            window.isUserPro = !!data.is_pro && isTierPro && !isExpired;
            console.log('Cloud Sync Success. Pro:', window.isUserPro);
            
            const profileTierBadge = document.getElementById('profile-tier-badge');
            const inputFullname = document.getElementById('profile-fullname');
            const inputCompany = document.getElementById('profile-company');
            const btnProfileUpgrade = document.getElementById('btn-profile-upgrade');

            // --- EXPANDED BILLING PORTAL HYDRATION ---
            const subPortalTier = document.getElementById('sub-portal-tier');
            const rowSubBilling = document.getElementById('row-sub-billing');
            const subBillingLabel = document.getElementById('sub-billing-label');
            const subPortalDate = document.getElementById('sub-portal-date');
            const rowSubProvider = document.getElementById('row-sub-provider');
            const subPortalProvider = document.getElementById('sub-portal-provider');
            const subPortalId = document.getElementById('sub-portal-id');
            const btnSubUpgrade = document.getElementById('btn-sub-upgrade');
            const btnSubManage = document.getElementById('btn-sub-manage');

            const isCancelled = data.subscription_provider === 'razorpay_cancelled' || data.subscription_provider === 'lemonsqueezy_cancelled';

            if (profileTierBadge) {
                if (window.isUserPro) {
                    const tierName = (data.subscription_tier || 'PRO').toUpperCase();
                    let expiryLabel = '';
                    if (isCancelled) {
                        profileTierBadge.className = 'tier-badge cancelled';
                        if (expiresAt && !isNaN(expiresAt.getTime())) {
                            expiryLabel = ` (Active until: ${expiresAt.toLocaleDateString()})`;
                        }
                        profileTierBadge.textContent = `${tierName} PASS${expiryLabel}`;
                    } else {
                        profileTierBadge.className = 'tier-badge pro';
                        if (expiresAt && !isNaN(expiresAt.getTime())) {
                            expiryLabel = ` (Next billing: ${expiresAt.toLocaleDateString()})`;
                        } else {
                            expiryLabel = ` (LIFETIME)`;
                        }
                        profileTierBadge.textContent = `${tierName} PASS${expiryLabel}`;
                    }
                } else if (window.isPremiumActive()) {
                    profileTierBadge.className = 'tier-badge pro';
                    profileTierBadge.textContent = '🎁 TEMPORARY PRO';
                } else {
                    profileTierBadge.className = 'tier-badge free';
                    profileTierBadge.textContent = 'FREE TIER';
                }
                
                if (btnProfileUpgrade) btnProfileUpgrade.style.display = window.isPremiumActive() ? 'none' : 'inline-block';
            }

            // Hydrate the expanded billing portal card details
            if (subPortalTier) {
                if (window.isUserPro) {
                    const tierClean = (data.subscription_tier || 'PRO').toUpperCase() + ' PASS';
                    subPortalTier.textContent = tierClean;
                    
                    // Expiration/Renewal Row
                    if (rowSubBilling && subBillingLabel && subPortalDate) {
                        if (expiresAt && !isNaN(expiresAt.getTime())) {
                            rowSubBilling.style.display = 'flex';
                            subPortalDate.textContent = expiresAt.toLocaleDateString();
                            
                            if (isCancelled) {
                                subBillingLabel.textContent = 'ACCESS UNTIL';
                                subPortalDate.style.color = '#ffb300'; // Amber
                            } else {
                                subBillingLabel.textContent = 'NEXT RECURRING';
                                subPortalDate.style.color = '#00ffcc'; // Neon cyan/green
                            }
                        } else {
                            rowSubBilling.style.display = 'flex';
                            subBillingLabel.textContent = 'ACCESS UNTIL';
                            subPortalDate.textContent = 'LIFETIME ACCESS';
                            subPortalDate.style.color = '#00ffcc';
                        }
                    }

                    // Provider Reference Row
                    if (rowSubProvider && subPortalProvider && subPortalId && data.subscription_id) {
                        rowSubProvider.style.display = 'flex';
                        subPortalProvider.textContent = data.subscription_provider ? data.subscription_provider.split('_')[0].toUpperCase() : 'GATEWAY';
                        subPortalId.textContent = data.subscription_id;
                    }

                    // Action buttons
                    if (btnSubUpgrade) btnSubUpgrade.style.display = 'none';
                    if (btnSubManage) {
                        btnSubManage.style.display = 'inline-block';
                        
                        if (isCancelled) {
                            btnSubManage.disabled = true;
                            btnSubManage.textContent = 'CANCELLATION PENDING';
                            btnSubManage.className = 'auth-submit-btn outline-warning';
                            btnSubManage.style.opacity = '0.5';
                            btnSubManage.style.cursor = 'not-allowed';
                        } else if (data.subscription_tier === 'lifetime') {
                            btnSubManage.disabled = true;
                            btnSubManage.textContent = 'LIFETIME IS PERMANENT';
                            btnSubManage.className = 'auth-submit-btn outline-warning';
                            btnSubManage.style.opacity = '0.5';
                            btnSubManage.style.cursor = 'not-allowed';
                        } else {
                            btnSubManage.disabled = false;
                            btnSubManage.textContent = 'MANAGE SUBSCRIPTION';
                            btnSubManage.className = 'auth-submit-btn outline-warning';
                            btnSubManage.style.opacity = '1';
                            btnSubManage.style.cursor = 'pointer';
                        }
                    }
                } else {
                    // Free Tier / Temporary Pro
                    subPortalTier.textContent = window.isPremiumActive() ? '🎁 TEMPORARY PRO' : 'FREE TIER';
                    if (rowSubBilling) rowSubBilling.style.display = 'none';
                    if (rowSubProvider) rowSubProvider.style.display = 'none';
                    
                    if (btnSubUpgrade) btnSubUpgrade.style.display = 'inline-block';
                    if (btnSubManage) btnSubManage.style.display = 'none';
                }
            }
            
            // EMERGENCY BYPASS: If premium is active, hide the ad/offline lock immediately
            if (window.isPremiumActive()) {
                const adOverlay = document.getElementById('ad-manager-overlay');
                if (adOverlay) adOverlay.classList.add('hidden');
                
                // Hide all standard Google AdSense and bottom sponsor elements globally
                document.querySelectorAll('.adsbygoogle, .ad-banner-bottom, .ad-placeholder, #bottom-sponsor-banner').forEach(el => {
                    el.classList.add('hidden');
                    el.style.display = 'none';
                });
            }

            if (inputFullname) {
                inputFullname.value = (data.full_name === 'EMPTY' ? '' : data.full_name) || '';
            }
            if (inputCompany) {
                inputCompany.value = (data.company === 'EMPTY' ? '' : data.company) || '';
            }
            
            if (window.updatePremiumUI) window.updatePremiumUI();
            document.dispatchEvent(new CustomEvent('proStatusChanged', { detail: window.isPremiumActive() }));
        }
    } catch (err) {
        console.error('Fatal Sync Error:', err);
    }
}

window.initAuthSystem = initAuthSystem;
window.syncSubscriptionStatus = syncSubscriptionStatus;
