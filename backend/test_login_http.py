import sys
from pathlib import Path
import requests

# Test login via HTTP
def test_http_login():
    print("Testing HTTP login to backend...")
    
    url = "http://localhost:8000/login"
    data = {
        "username": "admin",
        "password": "admin123"
    }
    
    try:
        response = requests.post(url, data=data)
        print(f"\nStatus Code: {response.status_code}")
        print(f"Response: {response.text}")
        
        if response.status_code == 200:
            print("\n✅ Login SUCCESSFUL!")
            json_data = response.json()
            print(f"Access Token (first 50 chars): {json_data.get('access_token', '')[:50]}...")
        else:
            print(f"\n❌ Login FAILED!")
            
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_http_login()
