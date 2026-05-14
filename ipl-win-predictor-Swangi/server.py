import os
import pickle
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load the model
try:
    pipe = pickle.load(open('pipe.pkl', 'rb'))
except Exception as e:
    print(f"Error loading model: {e}")
    pipe = None

@app.route('/predict', methods=['POST'])
def predict():
    if pipe is None:
        return jsonify({'error': 'Model not loaded'}), 500

    data = request.json
    try:
        batting_team = data['batting_team']
        bowling_team = data['bowling_team']
        selected_city = data['city']
        target = int(data['target'])
        score = int(data['score'])
        wickets = int(data['wickets'])
        overs = float(data['overs'])

        runs_left = target - score
        balls_left = 120 - (overs * 6)
        wickets_left = 10 - wickets
        
        # Avoid division by zero
        if overs > 0:
            crr = score / overs
        else:
            crr = 0
            
        if balls_left > 0:
            rrr = (runs_left * 6) / balls_left
        else:
            rrr = 0 # Or some large number

        input_df = pd.DataFrame({
            'batting_team': [batting_team],
            'bowling_team': [bowling_team],
            'city': [selected_city],
            'runs_left': [runs_left],
            'balls_left': [balls_left],
            'wickets': [wickets_left],
            'total_runs_x': [target],
            'crr': [crr],
            'rrr': [rrr]
        })

        result = pipe.predict_proba(input_df)
        
        win_prob = round(result[0][1] * 100)
        loss_prob = round(result[0][0] * 100)

        return jsonify({
            'batting_team': batting_team,
            'bowling_team': bowling_team,
            'win_probability': win_prob,
            'loss_probability': loss_prob
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/metadata', methods=['GET'])
def metadata():
    teams = sorted([
        'Sunrisers Hyderabad', 'Mumbai Indians', 'Royal Challengers Bangalore',
        'Kolkata Knight Riders', 'Kings XI Punjab', 'Chennai Super Kings',
        'Rajasthan Royals', 'Delhi Capitals'
    ])
    cities = sorted([
        'Hyderabad', 'Bangalore', 'Mumbai', 'Indore', 'Kolkata', 'Delhi',
        'Chandigarh', 'Jaipur', 'Chennai', 'Cape Town', 'Port Elizabeth',
        'Durban', 'Centurion', 'East London', 'Johannesburg', 'Kimberley',
        'Bloemfontein', 'Ahmedabad', 'Cuttack', 'Nagpur', 'Dharamsala',
        'Visakhapatnam', 'Pune', 'Raipur', 'Ranchi', 'Abu Dhabi',
        'Sharjah', 'Mohali', 'Bengaluru'
    ])
    return jsonify({'teams': teams, 'cities': cities})

if __name__ == '__main__':
    app.run(debug=True, port=5000)
