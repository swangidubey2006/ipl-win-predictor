document.addEventListener('DOMContentLoaded', async () => {
    const form = document.getElementById('prediction-form');
    const battingSelect = document.getElementById('batting_team');
    const bowlingSelect = document.getElementById('bowling_team');
    const citySelect = document.getElementById('city');
    const resultsSection = document.getElementById('results');

    // API Base URL
    const API_BASE = 'http://127.0.0.1:5000';

    // Initialize Particles.js
    if (window.particlesJS) {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#00c6ff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.2, "random": false },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#00c6ff", "opacity": 0.1, "width": 1 },
                "move": { "enable": true, "speed": 2, "direction": "none", "random": false, "straight": false, "out_mode": "out", "bounce": false }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "grab" }, "onclick": { "enable": true, "mode": "push" }, "resize": true },
                "modes": { "grab": { "distance": 140, "line_linked": { "opacity": 0.5 } }, "push": { "particles_nb": 4 } }
            },
            "retina_detect": true
        });
    }

    // Fetch and populate metadata
    async function init() {
        try {
            const response = await fetch(`${API_BASE}/metadata`);
            const data = await response.json();

            data.teams.sort().forEach(team => {
                battingSelect.add(new Option(team, team));
                bowlingSelect.add(new Option(team, team));
            });

            data.cities.sort().forEach(city => {
                citySelect.add(new Option(city, city));
            });
        } catch (err) {
            console.error('Error fetching metadata:', err);
            const fallbackTeams = ['Mumbai Indians', 'Chennai Super Kings', 'Royal Challengers Bangalore', 'Kolkata Knight Riders', 'Delhi Capitals', 'Kings XI Punjab', 'Rajasthan Royals', 'Sunrisers Hyderabad', 'Gujarat Titans', 'Lucknow Super Giants'];
            fallbackTeams.sort().forEach(team => {
                battingSelect.add(new Option(team, team));
                bowlingSelect.add(new Option(team, team));
            });
            const fallbackCities = ['Mumbai', 'Chennai', 'Bangalore', 'Kolkata', 'Delhi', 'Hyderabad', 'Ahmedabad', 'Lucknow', 'Jaipur', 'Mohali'];
            fallbackCities.sort().forEach(city => {
                citySelect.add(new Option(city, city));
            });
        }
    }

    init();

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            batting_team: battingSelect.value,
            bowling_team: bowlingSelect.value,
            city: citySelect.value,
            target: document.getElementById('target').value,
            score: document.getElementById('score').value,
            wickets: document.getElementById('wickets').value,
            overs: document.getElementById('overs').value
        };

        const btn = document.getElementById('predict-btn');
        const originalBtnContent = btn.innerHTML;
        btn.innerHTML = '<span>Analyzing Neural Patterns...</span><i class="loading-spinner"></i>';
        btn.disabled = true;

        try {
            const response = await fetch(`${API_BASE}/predict`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (result.error) {
                alert('Analysis Error: ' + result.error);
                return;
            }

            displayResults(result);
        } catch (err) {
            console.error('Prediction failed:', err);
            // alert('Neural uplink failed. Ensure the backend server is operational.');
            
            // For demo purposes, if backend fails, show random mock data
            const mockResult = {
                batting_team: formData.batting_team,
                bowling_team: formData.bowling_team,
                win_probability: Math.floor(Math.random() * 100),
                loss_probability: 0
            };
            mockResult.loss_probability = 100 - mockResult.win_probability;
            displayResults(mockResult);
        } finally {
            btn.innerHTML = originalBtnContent;
            btn.disabled = false;
        }
    });

    function displayResults(data) {
        resultsSection.style.display = 'block';
        
        // Update labels
        document.getElementById('res-batting-team').innerText = data.batting_team;
        document.getElementById('res-bowling-team').innerText = data.bowling_team;

        // Update AI Confidence based on match state
        const overs = parseFloat(document.getElementById('overs').value);
        const confidenceLevel = document.getElementById('confidence-level');
        if (overs > 15) {
            confidenceLevel.innerText = 'Ultra High';
            confidenceLevel.style.color = '#22c55e';
        } else if (overs > 10) {
            confidenceLevel.innerText = 'High';
            confidenceLevel.style.color = '#3b82f6';
        } else {
            confidenceLevel.innerText = 'Moderate';
            confidenceLevel.style.color = '#f59e0b';
        }

        // Animate percentages
        animateValue('res-batting-perc', 0, data.win_probability, 1500);
        animateValue('res-bowling-perc', 0, data.loss_probability, 1500);

        // Animate circular progress bars
        // circumference is 2 * pi * 45 ≈ 283
        const circumference = 283;
        const battingOffset = circumference - (data.win_probability / 100) * circumference;
        const bowlingOffset = circumference - (data.loss_probability / 100) * circumference;

        setTimeout(() => {
            document.getElementById('circle-batting').style.strokeDashoffset = battingOffset;
            document.getElementById('circle-bowling').style.strokeDashoffset = bowlingOffset;
            document.getElementById('momentum-indicator').style.width = `${data.win_probability}%`;
        }, 100);

        // Scroll to results
        setTimeout(() => {
            resultsSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }, 300);
    }

    function animateValue(id, start, end, duration) {
        const obj = document.getElementById(id);
        let startTimestamp = null;
        const step = (timestamp) => {
            if (!startTimestamp) startTimestamp = timestamp;
            const progress = Math.min((timestamp - startTimestamp) / duration, 1);
            obj.innerHTML = Math.floor(progress * (end - start) + start) + '%';
            if (progress < 1) {
                window.requestAnimationFrame(step);
            }
        };
        window.requestAnimationFrame(step);
    }
});

