/**
 * Parse GPT-generated recommendations text into structured data
 */
function parseRecommendations(text) {
    const recommendations = [];
    
    console.log('Parsing recommendations, text length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
    
    // Split by "### Recommendation" headers (new format) or numbered items
    let sections = text.split(/(?=### Recommendation \d+:)/i);
    if (sections.length < 2) {
        // Try format with --- separators (v2 system format)
        sections = text.split(/\n\n---\n\n/);
    }
    if (sections.length < 2) {
        // Try format with --- on separate line
        sections = text.split(/\n---\n/);
    }
    if (sections.length < 2) {
        // Try old format with numbered items
        sections = text.split(/(?=^\d+\.\s)/m);
    }
    if (sections.length < 2) {
        sections = text.split(/\n(?=\d+\.\s+)/);
    }
    if (sections.length < 2) {
        sections = text.split(/\n(?=\d+\.)/);
    }
    if (sections.length < 2) {
        sections = text.split(/\n\n(?=\d+\.)/);
    }
    
    console.log(`Split into ${sections.length} sections`);
    
    sections.forEach((section, idx) => {
        if (!section.trim()) return;
        
        const rec = {
            name: '',
            url: '',
            whyMatches: '',
            date: '',
            time: '',
            location: '',
            isRecurring: false
        };
        
        // Extract name - try multiple patterns (handle **1. Name** format)
        // Handle "### Recommendation N: Name" format first
        let nameMatch = section.match(/### Recommendation \d+:\s*(.+?)(?:\n|$)/i);
        if (!nameMatch) {
            // Try v2 format: first line is the name
            const lines = section.split('\n').filter(l => l.trim());
            if (lines.length > 0) {
                const firstLine = lines[0].trim();
                // Check if it looks like a name (not a URL, not starting with common prefixes)
                if (firstLine && 
                    !firstLine.match(/^(https?:\/\/|www\.|Type|Why|Logistics|What|How|URL|Date|Time|Location|TBD):/i) &&
                    firstLine.length < 200) {
                    rec.name = firstLine.replace(/\*\*/g, '').trim();
                }
            }
        }
        if (!rec.name) {
            // Try "1. **Event/Activity Name:** Name" format
            nameMatch = section.match(/\d+\.\s*\*\*Event\/Activity Name:\*\*\s*(.+?)(?:\n|$)/i);
        }
        if (!rec.name && !nameMatch) {
            nameMatch = section.match(/^\d+\.\s*\*\*(.+?)\*\*/m);
        }
        if (!rec.name && !nameMatch) {
            nameMatch = section.match(/^\d+\.\s+Event\/Activity Name[:\-]\s*(.+?)(?:\n|$)/i);
        }
        if (!rec.name && !nameMatch) {
            nameMatch = section.match(/^\d+\.\s+(.+?)(?:\n|$)/m);
        }
        if (!rec.name && !nameMatch) {
            // Try to get first non-empty line after number
            const lines = section.split('\n').filter(l => l.trim());
            if (lines.length > 0) {
                const firstLine = lines[0].replace(/^\d+\.\s*/, '').trim();
                if (firstLine && !firstLine.match(/^(Type|Why|Logistics|What|How|URL):/i)) {
                    rec.name = firstLine.replace(/\*\*/g, '').trim();
                }
            }
        }
        if (nameMatch && !rec.name) {
            rec.name = (nameMatch[1] || nameMatch[2] || '').trim().replace(/\*\*/g, '');
        }
        
        // Extract recurring status from Type field - handle "2. **Type:** Recurring [Category]" format
        const typeMatch = section.match(/\d+\.\s*\*\*Type:\*\*\s*([^\n]+)/i) ||
                         section.match(/-?\s*\*\*Type:\*\*\s*([^\n]+)/i) || 
                         section.match(/Type[:\-]\s*\[?([^\]]+)\]?/i) || 
                         section.match(/Type[:\-]\s*([^\n]+)/i);
        if (typeMatch) {
            const typeText = typeMatch[1].toLowerCase();
            rec.isRecurring = typeText.includes('recurring');
        }
        
        // Extract Why It Matches - handle multiple formats:
        // 1. New conversational format: **Why we think you'll like this:** ... **A few things to keep in mind:** ... **Bottom line:** ...
        // 2. Old format: "3. **Why It Matches:** ..."
        // 3. v2 format where it's the second line
        
        // First, try the new conversational format (capture all three sections)
        // Look for the full explanation that spans multiple lines
        if (section.includes('**Why we think you\'ll like this:**')) {
            // Extract the entire explanation block (from "Why we think" to before date/time/URL)
            // Use a more robust pattern that captures everything until we hit a line that looks like date/time/location
            const explanationMatch = section.match(/\*\*Why we think you'll like this:\*\*\s*([\s\S]+?)(?=\n\s*(?:TBD\s+TBD|at\s+[A-Z]|https?:\/\/|www\.|\d{1,2}:\d{2}\s+(?:AM|PM)))/i);
            if (explanationMatch) {
                // The full explanation includes all three sections
                rec.whyMatches = '**Why we think you\'ll like this:**\n' + explanationMatch[1].trim();
            } else {
                // Fallback: try to get everything from "Why we think" to the end of the section
                // (before the URL line)
                const fallbackMatch = section.match(/(\*\*Why we think you'll like this:\*\*[\s\S]+?)(?=\nhttps?:\/\/|\nwww\.|$)/i);
                if (fallbackMatch) {
                    rec.whyMatches = fallbackMatch[1].trim();
                }
            }
        }
        
        // If new format didn't match, try old formats
        if (!rec.whyMatches) {
            whyMatch = section.match(/\d+\.\s*\*\*Why It Matches:\*\*\s*(.+?)(?=\n\s*\d+\.\s*\*\*(?:Logistics|What|How|URL)|$)/is) ||
                       section.match(/-?\s*\*\*Why It Matches:\*\*\s*(.+?)(?=\n\s*-?\s*\*\*(?:Logistics|What|How|URL)|$)/is) ||
                       section.match(/Why It Matches[:\-]\s*(.+?)(?=\n\s*(Logistics|What to Expect|How to Join|URL|$|\d+\.))/is);
            if (!whyMatch) {
                // Try v2 format: second line is usually the "why it matches" description
                const lines = section.split('\n').filter(l => l.trim());
                if (lines.length > 1) {
                    const secondLine = lines[1].trim();
                    // If it doesn't look like a URL or date/time, it's probably the description
                    if (secondLine && 
                        !secondLine.match(/^(https?:\/\/|www\.|TBD|Date|Time|Location|at |\d{1,2}:\d{2})/i) &&
                        secondLine.length > 20) {
                        rec.whyMatches = secondLine;
                    }
                }
            } else {
                rec.whyMatches = whyMatch[1].trim().replace(/\*\*/g, '');
            }
        }
        
        // Extract Logistics for date, time, location - handle "4. **Logistics:** ..." format
        // Also handle v2 format: "TBD TBD at San Francisco, CA"
        let logisticsMatch = section.match(/\d+\.\s*\*\*Logistics:\*\*\s*(.+?)(?=\n\s*\d+\.\s*\*\*(?:What|How|URL)|$)/is) ||
                            section.match(/-?\s*\*\*Logistics:\*\*\s*(.+?)(?=\n\s*-?\s*\*\*(?:What|How|URL)|$)/is) ||
                            section.match(/Logistics[:\-]\s*(.+?)(?=\n\s*(What to Expect|How to Join|URL|$|\d+\.))/is);
        
        // Try v2 format: look for "TBD TBD at Location" or date/time patterns
        if (!logisticsMatch) {
            const lines = section.split('\n').filter(l => l.trim());
            for (const line of lines) {
                // Look for patterns like "TBD TBD at San Francisco, CA" or date/time/location patterns
                if (line.match(/(TBD|at |\d{1,2}:\d{2}|[A-Za-z]+,?\s+[A-Z]{2})/i)) {
                    logisticsMatch = { 1: line };
                    break;
                }
            }
        }
        
        if (logisticsMatch) {
            const logistics = logisticsMatch[1].trim();
            
            // Extract time
            const timeMatch = logistics.match(/(\d{1,2}:\d{2}\s*(?:AM|PM|am|pm))/i);
            if (timeMatch) {
                rec.time = timeMatch[1].trim();
            } else if (logistics.includes('TBD')) {
                rec.time = 'TBD';
            }
            
            // Extract day/date patterns
            const dayMatch = logistics.match(/(every\s+[A-Za-z]+day|weekly|monthly|bi-weekly|first\s+[A-Za-z]+day|third\s+[A-Za-z]+day|next\s+[A-Za-z]+day|[A-Za-z]+day[s]?)/i);
            if (dayMatch) {
                rec.date = dayMatch[1].trim();
            } else {
                // Try date format
                const dateMatch = logistics.match(/(\d{1,2}\/\d{1,2}\/\d{4}|[A-Za-z]+\s+\d{1,2},?\s+\d{4}|next\s+[A-Za-z]+day|upcoming\s+weekend|Sun,?\s+[A-Za-z]+\s+\d{1,2}|Sat,?\s+[A-Za-z]+\s+\d{1,2})/i);
                if (dateMatch) {
                    rec.date = dateMatch[1].trim();
                } else if (logistics.includes('TBD')) {
                    rec.date = 'TBD';
                }
            }
            
            // Extract location - look for "at [Location]" or "in [Location]" or after comma
            const locationMatch = logistics.match(/(?:at|in)\s+([^,\.]+?)(?:\.|,|$)/i) ||
                                 logistics.match(/,\s*([^\.]+?)(?:\.|$)/);
            if (locationMatch) {
                rec.location = locationMatch[1].trim();
            }
        }
        
        // Extract URL - handle "7. **URL:** [text](url)" markdown format
        // Also handle v2 format where URL is on its own line
        let urlMatch = section.match(/\d+\.\s*\*\*URL:\*\*\s*\[[^\]]+\]\(([^\)]+)\)/i) ||
                      section.match(/-?\s*\*\*URL:\*\*\s*\[[^\]]+\]\(([^\)]+)\)/i) ||
                      section.match(/-?\s*\*\*URL:\*\*\s*(https?:\/\/[^\s\n]+)/i) ||
                      section.match(/URL[:\-]\s*(https?:\/\/[^\s\n]+)/i);
        
        // Try v2 format: look for URLs in the section (usually on a line by itself)
        if (!urlMatch) {
            const lines = section.split('\n').filter(l => l.trim());
            for (const line of lines) {
                const urlInLine = line.match(/(https?:\/\/[^\s\n]+)/i);
                if (urlInLine) {
                    urlMatch = urlInLine;
                    break;
                }
            }
        }
        if (!urlMatch) {
            // Try "How to Join" field for URLs - handle "6. **How to Join:** ..." format
            const howToJoinMatch = section.match(/\d+\.\s*\*\*How to Join:\*\*\s*(.+?)(?=\n\s*\d+\.|$)/is) ||
                                  section.match(/-?\s*\*\*How to Join:\*\*\s*(.+?)(?=\n|$)/is) ||
                                  section.match(/-?\s*How to Join[:\-]\s*(.+?)(?=\n|$)/is);
            if (howToJoinMatch) {
                const howToJoin = howToJoinMatch[1].trim();
                // Look for markdown links first
                const markdownLink = howToJoin.match(/\[([^\]]+)\]\(([^\)]+)\)/);
                if (markdownLink) {
                    rec.url = markdownLink[2].trim();
                } else {
                    // Look for URLs in the text
                    const urlInText = howToJoin.match(/(https?:\/\/[^\s\n]+)/i) ||
                                    howToJoin.match(/(www\.[^\s\n]+)/i) ||
                                    howToJoin.match(/([a-zA-Z0-9-]+\.(com|org|net|io|co)[^\s\n]*)/i);
                    if (urlInText) {
                        let url = urlInText[1].trim();
                        if (!url.startsWith('http')) {
                            url = 'https://' + url;
                        }
                        rec.url = url;
                    }
                }
            } else {
                // Fallback: search entire section for markdown links or URLs
                const markdownLink = section.match(/\[([^\]]+)\]\(([^\)]+)\)/);
                if (markdownLink) {
                    rec.url = markdownLink[2].trim();
                } else {
                    urlMatch = section.match(/(https?:\/\/[^\s\n]+)/i);
                    if (urlMatch) {
                        rec.url = urlMatch[1].trim();
                    }
                }
            }
        } else {
            rec.url = urlMatch[1].trim();
        }
        
        // Only add if we have at least a name
        if (rec.name && rec.name.length > 0 && rec.name.length < 200 && !rec.name.match(/^(Event\/Activity Name|Type|Name|Logistics|What|How|URL):/i)) {
            console.log(`Parsed recommendation ${idx + 1}:`, {
                name: rec.name.substring(0, 50),
                hasUrl: !!rec.url,
                hasWhy: !!rec.whyMatches,
                isRecurring: rec.isRecurring
            });
            recommendations.push(rec);
        }
    });
    
    console.log(`Total parsed: ${recommendations.length} recommendations`);
    return recommendations;
}

/**
 * Display recommendations on the page
 */
function displayRecommendations(recommendations, userId, userName = null) {
    // Parse recommendations
    const parsedRecs = parseRecommendations(recommendations);
    
    // If parsing failed, show raw text with a message
    if (parsedRecs.length === 0) {
        console.error('Failed to parse recommendations, showing raw text');
        const recommendationsHTML = `
            <div class="recommendations-header">
                <h2>Your Personalized Recommendations</h2>
                ${userName ? `<p style="color: #666; margin-bottom: 8px;">Welcome back, ${escapeHtml(userName)}!</p>` : ''}
                <p style="color: #666; margin-bottom: 16px;">We encountered an issue parsing the recommendations. Showing raw output:</p>
            </div>
            <div style="background: #f9f9f9; padding: 32px; border-radius: 12px; border: 2px solid #f0f0f0; white-space: pre-wrap; font-family: monospace; font-size: 14px; max-height: 600px; overflow-y: auto; margin-bottom: 20px;">
                ${escapeHtml(recommendations.substring(0, 5000))}
            </div>
            <div style="margin-top: 40px; text-align: center; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                ${userId ? `<button type="button" class="btn-primary" onclick="window.location.href='/survey/intake-survey.html?edit=true&userId=${userId}'">Edit Survey</button>` : ''}
                ${userId ? `<button type="button" class="btn-secondary" onclick="regenerateRecommendations('${userId}')">Get New Recommendations</button>` : ''}
                <button type="button" class="btn-secondary" onclick="window.location.href='/profile/login.html'" style="border-color: #667eea; color: #667eea;">Login as Different User</button>
            </div>
        `;
        document.querySelector('.recommendations-container').innerHTML = recommendationsHTML;
        return;
    }
    
    // Generate simple list HTML
    const listItems = parsedRecs.map((rec, index) => {
        const nameDisplay = rec.url 
            ? `<a href="${rec.url}" target="_blank" rel="noopener noreferrer" style="color: #FF8C42; text-decoration: none; font-weight: 600;">${escapeHtml(rec.name)}</a>`
            : `<strong>${escapeHtml(rec.name)}</strong>`;
        
        const dateTimeLocation = [
            rec.date ? `📅 ${escapeHtml(rec.date)}` : '',
            rec.time ? `🕐 ${escapeHtml(rec.time)}` : '',
            rec.location ? `📍 ${escapeHtml(rec.location)}` : ''
        ].filter(Boolean).join(' • ') || '';
        
        const recurringBadge = rec.isRecurring 
            ? '<span style="display: inline-block; background: #4CAF50; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 8px;">Recurring</span>'
            : '<span style="display: inline-block; background: #2196F3; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; margin-left: 8px;">One-Time</span>';
        
        return `
            <div style="background: #f9f9f9; padding: 24px; border-radius: 12px; margin-bottom: 20px; border: 2px solid #f0f0f0; transition: all 0.3s ease;">
                <div style="margin-bottom: 12px;">
                    <h3 style="font-family: 'Montserrat', sans-serif; font-size: 20px; color: #2C2C2C; margin: 0 0 8px 0; font-weight: 600;">
                        ${index + 1}. ${nameDisplay} ${recurringBadge}
                    </h3>
                    ${dateTimeLocation ? `<div style="color: #666; font-size: 14px; margin-bottom: 12px;">${dateTimeLocation}</div>` : ''}
                    ${rec.url ? `<div style="margin-bottom: 12px;"><a href="${rec.url}" target="_blank" rel="noopener noreferrer" style="color: #FF8C42; text-decoration: underline; font-size: 14px;">${rec.url}</a></div>` : ''}
                </div>
                ${rec.whyMatches ? `
                <div style="background: #FFF9F0; padding: 20px; border-radius: 8px; border-left: 3px solid #FF8C42; margin-top: 12px;">
                    ${formatWhyMatches(rec.whyMatches)}
                </div>
                ` : ''}
            </div>
        `;
    }).join('');
    
    // Check if these are conceptual recommendations
    const isConceptual = parsedRecs.some(r => r.isConceptual);
    
    // Create recommendations display
    const recommendationsHTML = `
        <div class="recommendations-header">
            <h2>Your Personalized Recommendations</h2>
            ${userName ? `<p style="color: #666; margin-bottom: 8px;">Welcome back, ${escapeHtml(userName)}!</p>` : ''}
            ${isConceptual ? `
                <div style="background: #FFF9F0; border-left: 3px solid #FF8C42; padding: 12px; margin-bottom: 16px; border-radius: 4px;">
                    <p style="color: #666; margin: 0; font-size: 14px; line-height: 1.5;">
                        💡 <strong>These are personalized activity concepts</strong> based on your profile. 
                        Use them as inspiration to find similar activities in your area.
                    </p>
                </div>
            ` : ''}
            <p style="color: #666; margin-bottom: 16px;">Based on your profile, we found ${parsedRecs.length} perfect matches for you</p>
        </div>
        
        <div>
            ${listItems}
        </div>
        
        <div style="margin-top: 40px; text-align: center; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            ${userId ? `<button type="button" class="btn-primary" onclick="window.location.href='/survey/intake-survey.html?edit=true&userId=${userId}'">Edit Survey</button>` : ''}
            ${userId ? `<button type="button" class="btn-secondary" onclick="regenerateRecommendations('${userId}')">Get New Recommendations</button>` : ''}
            <button type="button" class="btn-secondary" onclick="window.location.href='/profile/login.html'" style="border-color: #667eea; color: #667eea;">Login as Different User</button>
        </div>
    `;
    
    document.querySelector('.recommendations-container').innerHTML = recommendationsHTML;
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Regenerate recommendations for a user
 */
async function regenerateRecommendations(userId) {
    if (!userId) {
        alert('User ID is required');
        return;
    }
    
    // Show loading
    const container = document.querySelector('.recommendations-container');
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p style="color: #666; font-size: 16px;">Generating new recommendations...</p></div>';
    
    try {
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${API_BASE_URL}/api/recommendations/${userId}/regenerate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            // Handle both string and array formats
            const recommendations = result.recommendations || result.data?.recommendations;
            if (recommendations) {
                displayRecommendations(recommendations, userId);
            } else {
                console.error('Unexpected response format:', result);
                alert('Recommendations were generated but format is unexpected. Please refresh the page.');
                loadRecommendations(userId);
            }
        } else {
            alert(`We encountered an error: ${result.error}`);
            // Try to reload existing recommendations
            loadRecommendations(userId);
        }
    } catch (error) {
        alert(`We encountered an error: ${error.message}`);
        // Try to reload existing recommendations
        loadRecommendations(userId);
    }
}

/**
 * Load recommendations for a user
 */
async function loadRecommendations(userId) {
    if (!userId) {
        console.error('No userId provided');
        return;
    }
    
    // Check for refresh parameter to force reload
    const urlParams = new URLSearchParams(window.location.search);
    const forceRefresh = urlParams.get('refresh') === 'true';
    
    // Show loading
    const container = document.querySelector('.recommendations-container');
    container.innerHTML = '<div style="text-align: center; padding: 40px;"><div class="spinner"></div><p>Loading your recommendations...</p></div>';
    
    try {
        // Add cache-busting parameter if refresh is requested
        const cacheBuster = forceRefresh ? `?_t=${Date.now()}` : '';
        const API_BASE_URL = window.API_BASE_URL || 'http://localhost:3000';
        const response = await fetch(`${API_BASE_URL}/api/recommendations/${userId}${cacheBuster}`);
        
        const result = await response.json();
        
        if (result.success) {
            displayRecommendations(result.data.recommendations, userId, result.data.userName);
            
            // Remove refresh parameter from URL if present
            if (forceRefresh) {
                const newUrl = window.location.pathname + `?userId=${userId}`;
                window.history.replaceState({}, document.title, newUrl);
            }
        } else {
            container.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h2 style="font-family: 'Montserrat', sans-serif; font-size: 32px; color: #2C2C2C; margin-bottom: 16px; font-weight: 600;">No Recommendations Found</h2>
                    <p style="color: #666; margin-bottom: 16px; font-size: 16px;">${result.error || 'We couldn\'t find any recommendations for your account.'}</p>
                    <p style="color: #666; margin-bottom: 24px; font-size: 14px;">Don't worry! We can generate recommendations using your existing survey data.</p>
                    <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                        <button type="button" class="btn-primary" onclick="regenerateRecommendations('${userId}')">Generate Recommendations</button>
                        <button type="button" class="btn-secondary" onclick="window.location.href='/survey/intake-survey.html'">Take Survey Again</button>
                    </div>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading recommendations:', error);
        container.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="font-family: 'Montserrat', sans-serif; font-size: 32px; color: #2C2C2C; margin-bottom: 16px; font-weight: 600;">Error Loading Recommendations</h2>
                <p style="color: #666; margin-bottom: 16px; font-size: 16px;">${error.message}</p>
                <p style="color: #666; margin-bottom: 24px; font-size: 14px;">We can generate recommendations using your existing survey data.</p>
                <div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
                    ${userId ? `<button type="button" class="btn-primary" onclick="regenerateRecommendations('${userId}')">Generate Recommendations</button>` : ''}
                    <button type="button" class="btn-secondary" onclick="window.location.href='/survey/intake-survey.html'">${userId ? 'Take Survey Again' : 'Take Survey'}</button>
                </div>
            </div>
        `;
    }
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format the "why matches" explanation with proper styling for the new conversational format
 */
function formatWhyMatches(text) {
    if (!text) return '';
    
    // Check if it's the new conversational format (has markdown headers)
    if (text.includes('**Why we think you\'ll like this:**')) {
        // Split into sections
        const whyMatch = text.match(/\*\*Why we think you'll like this:\*\*\s*(.+?)(?=\*\*A few things to keep in mind:\*\*|$)/is);
        const thingsMatch = text.match(/\*\*A few things to keep in mind:\*\*\s*(.+?)(?=\*\*Bottom line:\*\*|$)/is);
        const bottomLineMatch = text.match(/\*\*Bottom line:\*\*\s*(.+?)$/is);
        
        let html = '';
        
        // Why we think you'll like this
        if (whyMatch) {
            html += `<div style="margin-bottom: 16px;">
                <div style="font-size: 15px; color: #FF8C42; font-weight: 600; margin-bottom: 8px;">Why we think you'll like this:</div>
                <div style="font-size: 14px; color: #555; line-height: 1.6;">${escapeHtml(whyMatch[1].trim())}</div>
            </div>`;
        }
        
        // A few things to keep in mind
        if (thingsMatch) {
            const thingsText = thingsMatch[1].trim();
            // Convert bullet points to HTML list
            const bullets = thingsText.split(/\n\s*[-•]\s*/).filter(b => b.trim());
            let thingsHtml = '';
            if (bullets.length > 1) {
                // Multiple bullets
                thingsHtml = '<ul style="margin: 8px 0; padding-left: 20px; color: #555;">';
                bullets.forEach(bullet => {
                    if (bullet.trim()) {
                        thingsHtml += `<li style="margin-bottom: 6px; line-height: 1.5;">${escapeHtml(bullet.trim())}</li>`;
                    }
                });
                thingsHtml += '</ul>';
            } else {
                // Single paragraph or no bullets
                thingsHtml = `<div style="font-size: 14px; color: #555; line-height: 1.6;">${escapeHtml(thingsText)}</div>`;
            }
            
            html += `<div style="margin-bottom: 16px;">
                <div style="font-size: 15px; color: #FF8C42; font-weight: 600; margin-bottom: 8px;">A few things to keep in mind:</div>
                ${thingsHtml}
            </div>`;
        }
        
        // Bottom line
        if (bottomLineMatch) {
            html += `<div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #FFE5CC;">
                <div style="font-size: 15px; color: #FF8C42; font-weight: 600; margin-bottom: 8px;">Bottom line:</div>
                <div style="font-size: 14px; color: #555; line-height: 1.6; font-weight: 500;">${escapeHtml(bottomLineMatch[1].trim())}</div>
            </div>`;
        }
        
        return html;
    } else {
        // Old format - just display as-is
        return `<div style="font-size: 14px; color: #FF8C42; font-weight: 600; margin-bottom: 8px;">Why this matches you:</div>
                <div style="font-size: 14px; color: #555; line-height: 1.6;">${escapeHtml(text)}</div>`;
    }
}

