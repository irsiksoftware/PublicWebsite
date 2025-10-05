"""
Agent Performance Logger
Tracks agent runs and updates performance.json for Thanos judgment.
"""

import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Dict, Optional


class PerformanceLogger:
    """Log agent performance metrics."""

    def __init__(self, performance_path: str = "cache/performance.json"):
        self.performance_path = Path(performance_path)
        self.performance_data = self._load_performance()

    def _load_performance(self) -> Dict:
        """Load performance data."""
        if not self.performance_path.exists():
            raise FileNotFoundError(f"Performance data not found at {self.performance_path}")

        with open(self.performance_path, 'r') as f:
            return json.load(f)

    def _save_performance(self):
        """Save updated performance data."""
        self.performance_data['last_updated'] = datetime.utcnow().isoformat() + 'Z'
        with open(self.performance_path, 'w') as f:
            json.dump(self.performance_data, f, indent=2)

    def log_run(
        self,
        agent_id: str,
        productive: bool,
        offense_type: Optional[str] = None,
        work_summary: str = ""
    ):
        """
        Log an agent run.

        Args:
            agent_id: Agent identifier (e.g., 'black_widow', 'thor')
            productive: Whether the run was productive
            offense_type: Type of offense if not productive ('silent_exit', 'empty_run', 'ghost_run', 'error_loop')
            work_summary: Summary of work done
        """
        if agent_id not in self.performance_data['agents']:
            print(f"[WARNING] Unknown agent: {agent_id}")
            return

        agent_data = self.performance_data['agents'][agent_id]

        # Update run counts
        agent_data['total_runs'] = agent_data.get('total_runs', 0) + 1

        if productive:
            agent_data['productive_runs'] = agent_data.get('productive_runs', 0) + 1
            agent_data['current_offense_streak'] = 0  # Reset streak on productive run
            agent_data['last_productive'] = datetime.utcnow().isoformat() + 'Z'

            print(f"[OK] {agent_data['name']}: Productive run logged")
            print(f"   {work_summary}")
        else:
            # Log offense
            agent_data['current_offense_streak'] = agent_data.get('current_offense_streak', 0) + 1

            if offense_type:
                offense_history = agent_data.get('offense_history', [])
                offense_history.append({
                    'type': offense_type,
                    'timestamp': datetime.utcnow().isoformat() + 'Z',
                    'summary': work_summary
                })
                agent_data['offense_history'] = offense_history

            print(f"[FAIL] {agent_data['name']}: Unproductive run logged")
            print(f"   Offense: {offense_type or 'unknown'}")
            print(f"   Streak: {agent_data['current_offense_streak']}")

        # Save updated data
        self._save_performance()

        # Show warning if streak is building
        streak = agent_data.get('current_offense_streak', 0)
        thresholds = self.performance_data.get('thresholds', {})

        if streak >= thresholds.get('offense_streak_timeout', 3):
            print(f"[WARNING] {agent_data['name']} at TIMEOUT threshold (streak: {streak})")
        elif streak >= thresholds.get('offense_streak_warning', 2):
            print(f"[WARNING] {agent_data['name']} approaching timeout (streak: {streak})")

    def get_agent_stats(self, agent_id: str) -> Dict:
        """Get current stats for an agent."""
        if agent_id not in self.performance_data['agents']:
            return {}

        agent_data = self.performance_data['agents'][agent_id]
        total = agent_data.get('total_runs', 0)
        productive = agent_data.get('productive_runs', 0)

        return {
            'name': agent_data.get('name'),
            'total_runs': total,
            'productive_runs': productive,
            'productivity_ratio': productive / total if total > 0 else 0.0,
            'current_streak': agent_data.get('current_offense_streak', 0),
            'status': agent_data.get('status', 'active'),
            'interval_minutes': agent_data.get('current_interval_minutes', 5)
        }


def main():
    """CLI entry point."""
    if len(sys.argv) < 3:
        print("Usage: python agent_performance_logger.py <agent_id> <productive> [offense_type] [summary]")
        print("\nExamples:")
        print("  python agent_performance_logger.py black_widow true '' 'Found issue #123'")
        print("  python agent_performance_logger.py thor false empty_run 'No PRs to review'")
        sys.exit(1)

    agent_id = sys.argv[1]
    productive = sys.argv[2].lower() == 'true'
    offense_type = sys.argv[3] if len(sys.argv) > 3 and sys.argv[3] else None
    work_summary = sys.argv[4] if len(sys.argv) > 4 else ""

    logger = PerformanceLogger()
    logger.log_run(agent_id, productive, offense_type, work_summary)

    # Print current stats
    stats = logger.get_agent_stats(agent_id)
    if stats:
        print(f"\n[STATS] Current Stats:")
        print(f"   Productivity: {stats['productive_runs']}/{stats['total_runs']} ({stats['productivity_ratio']:.1%})")
        print(f"   Status: {stats['status']} (interval: {stats['interval_minutes']}m)")


if __name__ == "__main__":
    main()
