$body = '{"username":"Kali","password":"Wcnmsb123456"}'
Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/login' -Method Post -Body $body -ContentType 'application/json'