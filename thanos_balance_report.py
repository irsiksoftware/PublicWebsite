import json

with open('cache/performance.json', 'r') as f:
    data = json.load(f)

agents = data['agents']
total = len(agents)
productive = sum(1 for a in agents.values() if a['productive_runs'] > 0)
disabled = sum(1 for a in agents.values() if a['status'] == 'disabled')
timed_out = sum(1 for a in agents.values() if a['timeout_count'] > 0 and a['status'] != 'disabled')

total_runs = sum(a['total_runs'] for a in agents.values())
total_productive = sum(a['productive_runs'] for a in agents.values())
swarm_prod = (total_productive / total_runs * 100) if total_runs > 0 else 0

print('THANOS JUDGMENT - SWARM BALANCE REPORT')
print('=' * 50)
print(f'Total Agents:         {total}')
print(f'Productive Agents:    {productive}')
print(f'Timed Out:            {timed_out}')
print(f'Disabled:             {disabled}')
print(f'Overall Productivity: {swarm_prod:.1f}%')
print('=' * 50)
print()
print('AGENT STATUS:')
for name, agent in agents.items():
    status = 'ACTIVE  ' if agent['status'] == 'active' else 'DISABLED'
    prod_ratio = f"{agent['productive_runs']}/{agent['total_runs']}"
    prod_pct = (agent['productive_runs']/agent['total_runs']*100 if agent['total_runs'] > 0 else 0)
    print(f'{status} - {agent["name"]:<30} Productivity: {prod_ratio:>5} ({prod_pct:.0f}%)')
print()
print('Perfectly balanced, as all things should be.')
