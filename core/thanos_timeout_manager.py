"""
THANOS - TIMEOUT MANAGER
"Perfectly balanced, as all things should be."

Judges agent performance and enforces resource allocation through timeouts and disablement.
"""

import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple


class ThanosJudgment:
    """The Timeout Manager - ensuring only productive agents survive at full speed."""

    def __init__(self, performance_path: str = "cache/performance.json"):
        self.performance_path = Path(performance_path)
        self.performance_data = self._load_performance()
        self.decisions = []

    def _load_performance(self) -> Dict:
        """Load performance data from cache."""
        if not self.performance_path.exists():
            print("⚠️  Performance data not found. Creating baseline...")
            return self._create_baseline()

        with open(self.performance_path, 'r') as f:
            return json.load(f)

    def _create_baseline(self) -> Dict:
        """Create baseline performance tracking if it doesn't exist."""
        # This would create the structure - for now, error
        raise FileNotFoundError(f"Performance data not found at {self.performance_path}")

    def _save_performance(self):
        """Save updated performance data."""
        self.performance_data['last_updated'] = datetime.utcnow().isoformat() + 'Z'
        with open(self.performance_path, 'w') as f:
            json.dump(self.performance_data, f, indent=2)

    def analyze_performance(self) -> Dict[str, Dict]:
        """
        Analyze each agent's performance metrics.
        Returns dict of agent_name -> analysis.
        """
        analyses = {}
        agents = self.performance_data.get('agents', {})

        for agent_id, agent_data in agents.items():
            total = agent_data.get('total_runs', 0)
            productive = agent_data.get('productive_runs', 0)
            streak = agent_data.get('current_offense_streak', 0)

            # Calculate productivity ratio
            productivity_ratio = productive / total if total > 0 else 0.0

            # Analyze offense patterns
            offense_history = agent_data.get('offense_history', [])
            offense_types = {}
            for offense in offense_history[-10:]:  # Last 10 offenses
                offense_type = offense.get('type', 'unknown')
                offense_types[offense_type] = offense_types.get(offense_type, 0) + 1

            # Determine most common offense
            primary_offense = max(offense_types.items(), key=lambda x: x[1])[0] if offense_types else None

            analyses[agent_id] = {
                'name': agent_data.get('name', agent_id),
                'total_runs': total,
                'productive_runs': productive,
                'productivity_ratio': productivity_ratio,
                'current_streak': streak,
                'primary_offense': primary_offense,
                'offense_pattern': offense_types,
                'status': agent_data.get('status', 'active'),
                'current_interval': agent_data.get('current_interval_minutes', 5),
                'timeout_count': agent_data.get('timeout_count', 0)
            }

        return analyses

    def judge_agent(self, agent_id: str, analysis: Dict) -> Tuple[str, str]:
        """
        Judge a single agent and return (verdict, reasoning).

        Verdicts:
        - MERCY: Reset streak, give another chance
        - TIMEOUT: Double their interval
        - DISABLE: Set interval to 0, pause agent
        - PASS: No action needed
        """
        streak = analysis['current_streak']
        productivity = analysis['productivity_ratio']
        total_runs = analysis['total_runs']
        primary_offense = analysis['primary_offense']
        thresholds = self.performance_data.get('thresholds', {})

        # Not enough data yet
        if total_runs < 5:
            return 'PASS', 'Insufficient data for judgment (< 5 runs)'

        # High productivity - always pass
        if productivity >= thresholds.get('minimum_productivity_ratio', 0.6):
            if streak > 0:
                return 'MERCY', f'High productivity ({productivity:.1%}) despite recent streak - reset offense counter'
            return 'PASS', f'Productive agent ({productivity:.1%})'

        # Check offense streak
        if streak >= thresholds.get('offense_streak_disable', 5):
            return 'DISABLE', f'Chronic offender (streak: {streak}, productivity: {productivity:.1%}, primary: {primary_offense})'

        elif streak >= thresholds.get('offense_streak_timeout', 3):
            # Check if pattern is recoverable
            if primary_offense in ['silent_exit', 'empty_run']:
                return 'TIMEOUT', f'Recoverable pattern (streak: {streak}, primary: {primary_offense})'
            else:
                return 'TIMEOUT', f'Concerning pattern (streak: {streak}, primary: {primary_offense})'

        elif streak >= thresholds.get('offense_streak_warning', 2):
            return 'PASS', f'⚠️  Warning level (streak: {streak}, productivity: {productivity:.1%})'

        # Low productivity but no recent streak
        if productivity < 0.4 and total_runs >= 10:
            return 'TIMEOUT', f'Chronically low productivity ({productivity:.1%} over {total_runs} runs)'

        return 'PASS', 'Within acceptable parameters'

    def enforce_timeout(self, agent_id: str) -> bool:
        """
        Double the agent's Task Scheduler interval.
        Returns True if successful.
        """
        agent_data = self.performance_data['agents'][agent_id]
        current_interval = agent_data.get('current_interval_minutes', 5)
        new_interval = current_interval * 2

        # Update performance data
        agent_data['current_interval_minutes'] = new_interval
        agent_data['timeout_count'] = agent_data.get('timeout_count', 0) + 1

        # PowerShell command to modify Task Scheduler
        task_name = agent_data.get('name', agent_id).split('(')[0].strip().replace(' ', '')

        ps_command = f"""
        $trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(5) -RepetitionInterval (New-TimeSpan -Minutes {new_interval})
        Set-ScheduledTaskTrigger -TaskName "{task_name}" -Trigger $trigger
        """

        try:
            # Note: This will only work on Windows with PowerShell
            result = subprocess.run(
                ['powershell', '-Command', ps_command],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except Exception as e:
            print(f"⚠️  Failed to update Task Scheduler for {agent_id}: {e}")
            return False

    def enforce_disable(self, agent_id: str) -> bool:
        """
        Disable the agent's Task Scheduler task.
        Returns True if successful.
        """
        agent_data = self.performance_data['agents'][agent_id]

        # Update performance data
        agent_data['status'] = 'disabled'
        agent_data['current_interval_minutes'] = 0

        # PowerShell command to disable task
        task_name = agent_data.get('name', agent_id).split('(')[0].strip().replace(' ', '')

        ps_command = f'Disable-ScheduledTask -TaskName "{task_name}"'

        try:
            result = subprocess.run(
                ['powershell', '-Command', ps_command],
                capture_output=True,
                text=True,
                timeout=10
            )
            return result.returncode == 0
        except Exception as e:
            print(f"⚠️  Failed to disable Task Scheduler task for {agent_id}: {e}")
            return False

    def enforce_mercy(self, agent_id: str):
        """Reset offense streak for agent."""
        agent_data = self.performance_data['agents'][agent_id]
        agent_data['current_offense_streak'] = 0

    def execute_judgment(self):
        """Main judgment loop - analyze, judge, and enforce."""
        print("[THANOS TIMEOUT MANAGER]")
        print("=" * 60)
        print("Perfectly balanced, as all things should be.\n")

        # Phase 1: Analyze
        print("[PHASE 1: PERFORMANCE ANALYSIS]")
        analyses = self.analyze_performance()

        for agent_id, analysis in analyses.items():
            print(f"\n{analysis['name']}:")
            print(f"  Runs: {analysis['total_runs']} (Productive: {analysis['productive_runs']})")
            print(f"  Productivity: {analysis['productivity_ratio']:.1%}")
            print(f"  Offense Streak: {analysis['current_streak']}")
            if analysis['primary_offense']:
                print(f"  Primary Offense: {analysis['primary_offense']}")

        print("\n" + "=" * 60)
        print("[PHASE 2: JUDGMENT]")

        # Phase 2: Judge
        for agent_id, analysis in analyses.items():
            verdict, reasoning = self.judge_agent(agent_id, analysis)

            if verdict != 'PASS':
                self.decisions.append({
                    'agent_id': agent_id,
                    'agent_name': analysis['name'],
                    'verdict': verdict,
                    'reasoning': reasoning,
                    'productivity': f"{analysis['productive_runs']}/{analysis['total_runs']} ({analysis['productivity_ratio']:.1%})",
                    'streak': analysis['current_streak']
                })

            # Color code verdicts
            verdict_symbol = {
                'PASS': '[OK]',
                'MERCY': '[MERCY]',
                'TIMEOUT': '[TIMEOUT]',
                'DISABLE': '[DISABLE]'
            }.get(verdict, '[?]')

            print(f"\n{verdict_symbol} {analysis['name']}: {verdict}")
            print(f"   {reasoning}")

        # Phase 3: Enforce
        if self.decisions:
            print("\n" + "=" * 60)
            print("[PHASE 3: ENFORCEMENT]")

            for decision in self.decisions:
                verdict = decision['verdict']
                agent_id = decision['agent_id']

                if verdict == 'TIMEOUT':
                    success = self.enforce_timeout(agent_id)
                    status = "[OK]" if success else "[FAIL]"
                    print(f"{status} Doubled interval for {decision['agent_name']}")

                elif verdict == 'DISABLE':
                    success = self.enforce_disable(agent_id)
                    status = "[OK]" if success else "[FAIL]"
                    print(f"{status} Disabled {decision['agent_name']}")

                elif verdict == 'MERCY':
                    self.enforce_mercy(agent_id)
                    print(f"[MERCY] Reset offense streak for {decision['agent_name']}")

            # Save updated performance data
            self._save_performance()
        else:
            print("\n[OK] All agents performing within acceptable parameters.")

        # Phase 4: Balance Report
        self.generate_balance_report(analyses)

        return self.decisions

    def generate_balance_report(self, analyses: Dict) -> Dict:
        """Generate summary of swarm health."""
        print("\n" + "=" * 60)
        print("[PHASE 4: BALANCE REPORT]")

        total_agents = len(analyses)
        productive_agents = sum(1 for a in analyses.values() if a['productivity_ratio'] >= 0.6)
        timed_out = sum(1 for d in self.decisions if d['verdict'] == 'TIMEOUT')
        disabled = sum(1 for d in self.decisions if d['verdict'] == 'DISABLE')

        # Calculate overall swarm productivity
        total_runs = sum(a['total_runs'] for a in analyses.values())
        total_productive = sum(a['productive_runs'] for a in analyses.values())
        swarm_productivity = total_productive / total_runs if total_runs > 0 else 0.0

        report = {
            'total_agents': total_agents,
            'productive_agents': productive_agents,
            'timed_out': timed_out,
            'disabled': disabled,
            'swarm_productivity': swarm_productivity
        }

        print(f"\nSwarm Health:")
        print(f"   Total Agents: {total_agents}")
        print(f"   Productive (>=60%): {productive_agents}")
        print(f"   Timed Out: {timed_out}")
        print(f"   Disabled: {disabled}")
        print(f"   Overall Swarm Productivity: {swarm_productivity:.1%}")
        print(f"\nPerfectly balanced, as all things should be.")

        return report


def main():
    """Execute Thanos judgment."""
    thanos = ThanosJudgment()
    decisions = thanos.execute_judgment()

    # Exit code: number of enforcement actions taken
    sys.exit(len(decisions))


if __name__ == "__main__":
    main()
