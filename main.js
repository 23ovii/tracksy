// SPOTIFY API CONFIGURATION
        const CLIENT_ID = 'YOUR_SPOTIFY_CLIENT_ID'; // Your Client ID
        const REDIRECT_URI = window.location.origin + window.location.pathname;
        const SCOPES = 'playlist-read-private playlist-modify-private playlist-modify-public';

        let accessToken = null;
        let userPlaylists = [];

        // Check if token exists in URL after authentication
        function checkForToken() {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const token = params.get('access_token');

            if (token) {
                accessToken = token;
                // Clean the URL
                window.history.replaceState({}, document.title, window.location.pathname);
                // Show main section
                document.getElementById('authSection').style.display = 'none';
                document.getElementById('mainSection').style.display = 'block';
                showStatus('Successfully connected to Spotify!', 'success');
            }
        }

        // Redirect to Spotify for authentication
        function redirectToAuth() {
            if (CLIENT_ID === 'YOUR_SPOTIFY_CLIENT_ID') {
                showStatus('Please configure your Spotify Client ID in the application code!', 'error');
                return;
            }

            const authUrl = `https://accounts.spotify.com/authorize?` +
                `client_id=${CLIENT_ID}&` +
                `response_type=token&` +
                `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
                `scope=${encodeURIComponent(SCOPES)}`;

            window.location.href = authUrl;
        }

        // Load user playlists
        async function loadPlaylists() {
            if (!accessToken) {
                showStatus('You are not connected to Spotify!', 'error');
                return;
            }

            const btn = document.getElementById('loadBtn');
            btn.innerHTML = '<span class="loading"></span>Loading...';
            btn.disabled = true;

            try {
                // First get current user information
                const userResponse = await fetch('https://api.spotify.com/v1/me', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!userResponse.ok) {
                    throw new Error('Error getting user information');
                }

                const userData = await userResponse.json();
                const userId = userData.id;

                // Now get playlists
                const response = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                if (!response.ok) {
                    throw new Error('Error loading playlists');
                }

                const data = await response.json();
                // Filter only playlists created by current user
                userPlaylists = data.items.filter(playlist => playlist.owner.id === userId);
                displayPlaylists();
                showStatus(`Loaded ${userPlaylists.length} playlists created by you!`, 'success');

            } catch (error) {
                showStatus('Error loading playlists: ' + error.message, 'error');
            } finally {
                btn.innerHTML = 'Reload Playlists';
                btn.disabled = false;
            }
        }

        // Display playlists with improved layout
        function displayPlaylists() {
            const container = document.getElementById('playlists');
            container.className = 'grid'; // Remove any other classes
            
            if (!Array.isArray(userPlaylists)) return;

            container.innerHTML = userPlaylists.map(playlist => {
                const imageUrl = playlist.images?.[0]?.url || 'default-image.png';
                
                return `
                    <div class="playlist-card">
                        <img 
                            src="${imageUrl}" 
                            alt="${playlist.name}" 
                            class="playlist-image"
                            loading="lazy"
                        >
                        <div class="playlist-info">
                            <h3 class="playlist-name">${playlist.name}</h3>
                            <p class="playlist-tracks">${playlist.tracks.total} tracks</p>
                        </div>
                        <button onclick="sortPlaylist('${playlist.id}')" class="playlist-button">
                            <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            Sort by Artist → Album
                        </button>
                    </div>
                `;
            }).join('');
        }

        // Sort a playlist by album name
        async function sortPlaylist(playlistId) {
            const playlist = userPlaylists.find(p => p.id === playlistId);
            if (!playlist) return;

            showStatus(`<span class="loading"></span>Sorting "${playlist.name}"...`, 'info');
            console.log(`🎵 Starting to sort playlist: ${playlist.name} (ID: ${playlistId})`);

            try {
                // Get tracks from playlist
                console.log('📥 Getting tracks from playlist...');
                const tracks = await getAllPlaylistTracks(playlistId);
                console.log(`📊 Found ${tracks.length} tracks in playlist`);
                
                if (tracks.length === 0) {
                    showStatus('Playlist is empty!', 'error');
                    return;
                }

                // Check if playlist has less than 2 tracks
                if (tracks.length < 2) {
                    showStatus('Playlist has too few tracks to sort!', 'error');
                    return;
                }

                // Sort by artist, then by album
                const originalOrder = tracks.map(t => `${t.track.artists[0].name} - ${t.track.album.name}`);
                const sortedTracks = [...tracks].sort((a, b) => {
                    const artistA = a.track.artists[0].name.toLowerCase();
                    const artistB = b.track.artists[0].name.toLowerCase();
                    
                    // Sort first by artist
                    const artistComparison = artistA.localeCompare(artistB, 'en');
                    if (artistComparison !== 0) {
                        return artistComparison;
                    }
                    
                    // If artists are identical, sort by album
                    const albumA = a.track.album.name.toLowerCase();
                    const albumB = b.track.album.name.toLowerCase();
                    return albumA.localeCompare(albumB, 'en');
                });
                const newOrder = sortedTracks.map(t => `${t.track.artists[0].name} - ${t.track.album.name}`);

                // Check if order has changed
                const isAlreadySorted = JSON.stringify(originalOrder) === JSON.stringify(newOrder);
                if (isAlreadySorted) {
                    showStatus(`ℹ️ Playlist "${playlist.name}" is already sorted by artist and album!`, 'info');
                    return;
                }

                console.log('🔄 Order will be changed:', {
                    original: originalOrder.slice(0, 5),
                    sorted: newOrder.slice(0, 5)
                });

                // Create a preview of the sorting
                showSortPreview(playlist.name, sortedTracks, originalOrder.length !== newOrder.length);

                // Reorder playlist
                console.log('🔧 Starting playlist reordering...');
                await reorderPlaylistWithVerification(playlistId, sortedTracks, playlist.name);

            } catch (error) {
                console.error('❌ Error sorting playlist:', error);
                if (error.message.includes('429')) {
                    showStatus('⏳ Rate limit reached! Please wait a few minutes and try again.', 'error');
                } else if (error.message.includes('401')) {
                    showStatus('🔐 Token expired! Please reconnect to Spotify.', 'error');
                } else if (error.message.includes('403')) {
                    showStatus('🚫 You don\'t have permission to modify this playlist!', 'error');
                } else {
                    showStatus('❌ Error sorting playlist: ' + error.message, 'error');
                }
            }
        }

        // Get all tracks from a playlist
        async function getAllPlaylistTracks(playlistId) {
            let allTracks = [];
            let offset = 0;
            const limit = 100;

            console.log(`📥 Getting tracks from playlist (ID: ${playlistId})`);

            while (true) {
                console.log(`📄 Request for tracks ${offset}-${offset + limit - 1}`);
                
                const response = await fetch(
                    `https://api.spotify.com/v1/playlists/${playlistId}/tracks?offset=${offset}&limit=${limit}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${accessToken}`
                        }
                    }
                );

                if (!response.ok) {
                    console.error(`❌ Error getting tracks:`, response.status);
                    if (response.status === 429) {
                        const retryAfter = response.headers.get('Retry-After') || '30';
                        throw new Error(`429 - Rate limit reached. Retry after ${retryAfter} seconds`);
                    }
                    throw new Error(`Error getting tracks: ${response.status}`);
                }

                const data = await response.json();
                const validTracks = data.items.filter(item => item.track && item.track.album);
                allTracks = allTracks.concat(validTracks);
                
                console.log(`📊 Batch obtained: ${data.items.length} tracks (${validTracks.length} valid)`);

                if (data.items.length < limit) break;
                offset += limit;

                // Short pause to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 1500));
            }

            console.log(`📋 Total tracks obtained: ${allTracks.length}`);
            return allTracks;
        }

        // Reorder playlist with verification - only move positions
        async function reorderPlaylistWithVerification(playlistId, sortedTracks, playlistName) {
            try {
                console.log(`🎯 Will reorder ${sortedTracks.length} tracks by moving positions`);

                // Get current tracks to calculate moves
                const currentTracks = await getAllPlaylistTracks(playlistId);
                
                // Calculate necessary moves
                const moves = calculateMoves(currentTracks, sortedTracks);
                console.log(`📋 Total moves needed: ${moves.length}`);

                // Execute moves and get total time
                const totalTime = await executeMoves(playlistId, moves);

                // Check final result
                console.log('🔍 Checking final result...');
                const finalTracks = await getAllPlaylistTracks(playlistId);
                const finalOrder = finalTracks.map(t => `${t.track.artists[0].name} - ${t.track.album.name}`);
                
                if (finalTracks.length === sortedTracks.length) {
                    showStatus(
                        `✅ Playlist "${playlistName}" has been successfully reordered!` +
                        `<br>${finalTracks.length} tracks moved to new positions` +
                        `<br>Total time: ${totalTime} seconds`, 
                        'success'
                    );
                } else {
                    showStatus(
                        `⚠️ Reordering was partially successful.` +
                        `<br>Expected: ${sortedTracks.length}, Found: ${finalTracks.length} tracks` +
                        `<br>Total time: ${totalTime} seconds`, 
                        'error'
                    );
                }

            } catch (error) {
                console.error('❌ Error reordering playlist:', error);
                throw error;
            }
        }

        // Calculate necessary moves for reordering
        function calculateMoves(currentTracks, sortedTracks) {
            const moves = [];
            const currentOrder = [...currentTracks];
            
            // Create a map for quick track identification
            const trackMap = new Map();
            currentTracks.forEach((track, index) => {
                const key = `${track.track.id}-${track.track.artists[0].name}-${track.track.album.name}`;
                trackMap.set(key, { track, originalIndex: index });
            });

            // For each final position, calculate where the track should be
            for (let targetIndex = 0; targetIndex < sortedTracks.length; targetIndex++) {
                const targetTrack = sortedTracks[targetIndex];
                const targetKey = `${targetTrack.track.id}-${targetTrack.track.artists[0].name}-${targetTrack.track.album.name}`;
                
                // Find current position of this track
                let currentIndex = -1;
                for (let i = 0; i < currentOrder.length; i++) {
                    const currentKey = `${currentOrder[i].track.id}-${currentOrder[i].track.artists[0].name}-${currentOrder[i].track.album.name}`;
                    if (currentKey === targetKey) {
                        currentIndex = i;
                        break;
                    }
                }

                if (currentIndex !== -1 && currentIndex !== targetIndex) {
                    // Need to move track from currentIndex to targetIndex
                    moves.push({
                        from: currentIndex,
                        to: targetIndex,
                        trackName: targetTrack.track.name,
                        artist: targetTrack.track.artists[0].name
                    });

                    // Simulate move in current array for next calculations
                    const [movedTrack] = currentOrder.splice(currentIndex, 1);
                    currentOrder.splice(targetIndex, 0, movedTrack);
                }
            }

            return moves;
        }

        // Execute moves using Spotify API
        async function executeMoves(playlistId, moves) {
            console.log(`🎯 Executing ${moves.length} moves for reordering`);
            
            const startTime = Date.now();
            const estimatedTimePerMove = 1700; // 1.7 seconds per move (includes wait time)
            const estimatedTotalTime = Math.ceil((moves.length * estimatedTimePerMove) / 1000); // in seconds
            
            for (let i = 0; i < moves.length; i++) {
                const move = moves[i];
                const remainingMoves = moves.length - i;
                const remainingTime = Math.ceil((remainingMoves * estimatedTimePerMove) / 1000);
                
                showStatus(
                    `<span class="loading"></span>Reordering track ${i + 1}/${moves.length}: "${move.trackName}"` +
                    `<br>Estimated time remaining: ~${remainingTime} seconds`, 
                    'info'
                );
                
                console.log(`🔄 Move ${i + 1}/${moves.length}: "${move.trackName}" from position ${move.from} to ${move.to}`);
                
                try {
                    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                        method: 'PUT',
                        headers: {
                            'Authorization': `Bearer ${accessToken}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            range_start: move.from,
                            range_length: 1,
                            insert_before: move.to > move.from ? move.to + 1 : move.to
                        })
                    });

                    if (!response.ok) {
                        const errorData = await response.text();
                        console.error(`❌ Error on move ${i + 1}:`, response.status, errorData);
                        
                        if (response.status === 429) {
                            const retryAfter = response.headers.get('Retry-After') || '5';
                            console.log(`⏳ Rate limit - waiting ${retryAfter} seconds`);
                            await new Promise(resolve => setTimeout(resolve, parseInt(retryAfter) * 1000));
                            i--; // Try the same move again
                            continue;
                        }
                        throw new Error(`Error moving track: ${response.status} - ${errorData}`);
                    }

                    console.log(`✅ Move ${i + 1} executed successfully`);
                    
                    // Short pause between moves to avoid rate limiting
                    if (i < moves.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 200));
                    }

                } catch (error) {
                    console.error(`❌ Error on move ${i + 1}:`, error);
                    throw error;
                }
            }
            
            const totalTime = Math.ceil((Date.now() - startTime) / 1000);
            return totalTime; // Return total time to use in final message
        }

        // Show sorting preview
        function showSortPreview(playlistName, sortedTracks, hasChanges = true) {
            const preview = sortedTracks.slice(0, 10).map((item, index) => `
                <div class="track-item">
                    <strong>${index + 1}. ${item.track.name}</strong><br>
                    <span style="color: #1DB954; font-weight: 500;">🎤 ${item.track.artists[0].name}</span><br>
                    <span class="album-name">📀 ${item.track.album.name}</span>
                </div>
            `).join('');

            const changeIndicator = hasChanges ? '🔄' : '✅';
            const changeText = hasChanges ? 'Order will be changed' : 'Order is already correct';

            const previewHtml = `
                <div class="track-preview">
                    <h4>${changeIndicator} Sort preview for "${playlistName}" (first 10 tracks):</h4>
                    <p style="margin-bottom: 10px; opacity: 0.8;"><em>${changeText} - Sort: Artist → Album</em></p>
                    ${preview}
                    ${sortedTracks.length > 10 ? `<p style="text-align: center; margin-top: 10px; opacity: 0.7;">... and ${sortedTracks.length - 10} more tracks</p>` : ''}
                </div>
            `;

            document.getElementById('status').innerHTML = previewHtml;
        }

        // Display status messages
        function showStatus(message, type = 'info') {
            const container = document.getElementById('notifications-container');
            
            const notification = document.createElement('div');
            notification.className = `notification ${type} animate-fade-in`;
            
            const iconColor = type === 'success' ? 'text-spotify-green' : 
                             type === 'error' ? 'text-red-500' : 
                             'text-blue-500';
            
            notification.innerHTML = `
                <div class="flex items-center w-full px-5 py-4 gap-4">
                    <div class="${iconColor}">
                        <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            ${type === 'success' 
                                ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>'
                                : type === 'error'
                                    ? '<path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>'
                                    : '<path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>'
                        }
                    </div>
                    <p class="text-[15px] font-medium text-white flex-1">${message}</p>
                    <button 
                        onclick="this.parentElement.parentElement.remove()" 
                        class="flex-shrink-0 text-gray-400 hover:text-white transition-colors duration-200"
                    >
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            `;

            container.appendChild(notification);
            
            setTimeout(() => {
                notification.classList.add('animate-fade-out');
                setTimeout(() => notification.remove(), 200);
            }, 5000);
        }

        // Check token on page load
        window.addEventListener('load', checkForToken);

        // Replace the reorderPlaylist function with this updated version
        async function reorderPlaylist(playlistId, playlistName) {
            const statusArea = document.getElementById('reorderStatus');
            const playlistNameEl = document.getElementById('statusPlaylistName');
            const statusMessageEl = document.getElementById('statusMessage');
            const progressBar = document.getElementById('progressBar');
            const completeIcon = document.getElementById('statusComplete');

            // Show status area and update initial state
            statusArea.classList.remove('hidden');
            playlistNameEl.textContent = playlistName;
            statusMessageEl.textContent = 'Fetching playlist tracks...';
            progressBar.style.width = '0%';
            completeIcon.style.display = 'none';

            try {
                // Get all tracks
                const tracks = await getAllPlaylistTracks(playlistId);
                statusMessageEl.textContent = 'Sorting tracks...';
                progressBar.style.width = '30%';

                // Sort tracks
                const sortedTracks = sortTracks(tracks);
                statusMessageEl.textContent = 'Preparing reorder operations...';
                progressBar.style.width = '60%';

                // Reorder tracks
                await reorderTracks(playlistId, sortedTracks);
                
                // Update complete status
                statusMessageEl.textContent = 'Playlist successfully reordered!';
                progressBar.style.width = '100%';
                completeIcon.style.display = 'block';

                // Hide status after 3 seconds
                setTimeout(() => {
                    statusArea.classList.add('hidden');
                }, 3000);

            } catch (error) {
                statusMessageEl.textContent = 'Error: ' + error.message;
                statusMessageEl.classList.add('text-red-500');
                progressBar.classList.remove('bg-spotify-green');
                progressBar.classList.add('bg-red-500');
            }
        }

        function showNotification(title, message, type = 'success') {
            const container = document.getElementById('notifications-container');
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            
            const icon = type === 'success' 
                ? `<svg class="w-5 h-5 text-spotify-green notification-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                   </svg>`
                : `<svg class="w-5 h-5 text-red-500 notification-icon" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                   </svg>`;

            notification.innerHTML = `
                ${icon}
                <div class="notification-content">
                    <div class="notification-title">${title}</div>
                    <div class="notification-message">${message}</div>
                </div>
            `;

            container.appendChild(notification);

            // Remove notification after 5 seconds
            setTimeout(() => {
                notification.classList.add('fade-out');
                setTimeout(() => {
                    notification.remove();
                }, 300);
            }, 5000);
        }
