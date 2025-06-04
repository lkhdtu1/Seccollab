import requests

# Step 1: Login to get the JWT token
login_url = "http://127.0.0.1:5000/api/auth/login"
login_data = {
    "email": "me@gmail.com",
    "password": "john"
}
login_response = requests.post(login_url, json=login_data)
access_token = login_response.json().get("access_token")

if access_token:
    # Step 2: Use the token to access the stats API
    stats_url = "http://127.0.0.1:5000/api/stats/dashboard"
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    stats_response = requests.get(stats_url, headers=headers)
    print(stats_response.json())
else:
    print("Failed to get access token")