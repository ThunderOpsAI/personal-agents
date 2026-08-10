import urllib.request
import urllib.parse
import json
import sys

def _smoke_test_endpoint(url, data=None, method='GET'):
    print(f"=== Testing {method} {url} ===")
    try:
        req = urllib.request.Request(url, method=method)
        if data:
            req.add_header('Content-Type', 'application/json')
            jsondata = json.dumps(data).encode('utf-8')
            req.data = jsondata
        with urllib.request.urlopen(req) as response:
            result = response.read().decode('utf-8')
            print(f"Status: {response.status}")
            try:
                print(json.dumps(json.loads(result), indent=2))
            except:
                print(result)
            print("PASS")
    except urllib.error.HTTPError as e:
        print(f"Status: {e.code}")
        print(e.read().decode('utf-8'))
        print("FAIL")
    except Exception as e:
        print(f"Error: {e}")
        print("FAIL")
    print()

_smoke_test_endpoint('http://localhost:8000/healthz')
_smoke_test_endpoint('http://localhost:8000/api/v1/weather')
_smoke_test_endpoint('http://localhost:8000/api/v1/agenda')
_smoke_test_endpoint('http://localhost:8000/api/v1/notes')
_smoke_test_endpoint('http://localhost:8000/api/v1/rumble/chat', data={"message": "I have lumbar pain 8 out of 10 tonight"}, method='POST')
_smoke_test_endpoint('http://localhost:8000/api/v1/rumble/chat', data={"message": "Spent $45 at Coles today on groceries"}, method='POST')
_smoke_test_endpoint('http://localhost:8000/api/v1/rumble/chat', data={"message": "Remind me to call the physiotherapist tomorrow"}, method='POST')
_smoke_test_endpoint('http://localhost:8000/api/v1/rumble/chat', data={"message": "What specialist should I see for my knee pain?"}, method='POST')
_smoke_test_endpoint('http://localhost:8000/api/v1/rumble/chat', data={"message": "Good morning Rumble"}, method='POST')
_smoke_test_endpoint('http://localhost:8000/api/v1/budget')
_smoke_test_endpoint('http://localhost:8000/api/v1/budget', data={"description": "Chemist Warehouse", "amount": 29.95, "notes": "Pain patches"}, method='POST')
_smoke_test_endpoint('http://localhost:8000/api/v1/pain/log', data={"pain_level": 6, "generators": [{"area": "lumbar", "side": "right", "percentage": 80}], "pain_notes": "Stiffness after sitting", "mood_level": 7}, method='POST')
_smoke_test_endpoint('http://localhost:8000/api/v1/voice/parse', data={"transcript": "Right knee pain 6 out of 10"}, method='POST')
_smoke_test_endpoint('http://localhost:8000/')
