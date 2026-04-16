import sqlite3
conn = sqlite3.connect('greenpoint.db')
cursor = conn.cursor()
cursor.execute('SELECT offense_tier, points_delta, created_at FROM ledger WHERE user_id=? AND event_type=? ORDER BY created_at', ('citizen-1001', 'violation'))
results = cursor.fetchall()
print(f'Total violations for citizen-1001: {len(results)}')
for row in results:
    print(f'Tier {row[0]}, points_delta: {row[1]}, created: {row[2]}')
conn.close()
