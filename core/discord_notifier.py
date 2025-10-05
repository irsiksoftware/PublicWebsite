"""
Discord Notification System for Agent Swarm
Sends updates about agent activities, judgments, and swarm health.
"""

import json
import os
import sys
from datetime import datetime
from typing import Dict, List, Optional
import requests


class DiscordNotifier:
    """Send notifications to Discord webhook."""

    def __init__(self, webhook_url: Optional[str] = None):
        self.webhook_url = webhook_url or os.getenv('DISCORD_WEBHOOK_URL')
        if not self.webhook_url:
            raise ValueError("Discord webhook URL not configured. Set DISCORD_WEBHOOK_URL environment variable.")

    def send_message(self, content: str, embeds: Optional[List[Dict]] = None) -> bool:
        """
        Send a message to Discord.

        Args:
            content: Main message content
            embeds: Optional list of Discord embed objects

        Returns:
            True if successful, False otherwise
        """
        payload = {
            'content': content,
            'username': 'Thanos - Timeout Manager'
        }

        if embeds:
            payload['embeds'] = embeds

        try:
            response = requests.post(
                self.webhook_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            return response.status_code == 204
        except Exception as e:
            print(f"⚠️  Failed to send Discord notification: {e}")
            return False

    def notify_thanos_judgment(self, decisions: List[Dict]) -> bool:
        """
        Notify Discord about Thanos judgment decisions.

        Args:
            decisions: List of judgment decisions from ThanosJudgment

        Returns:
            True if notification sent successfully
        """
        if not decisions:
            content = "⚖️  **Thanos has judged:** All agents performing within acceptable parameters.\n\n💭 *Perfectly balanced, as all things should be.*"
            return self.send_message(content)

        # Build message
        content = "⚖️  **Thanos has judged:**\n\n"

        embeds = []
        for decision in decisions:
            verdict_emoji = {
                'TIMEOUT': '⏱️',
                'DISABLE': '❌',
                'MERCY': '🛡️'
            }.get(decision['verdict'], '❓')

            verdict_color = {
                'TIMEOUT': 0xFFA500,  # Orange
                'DISABLE': 0xFF0000,  # Red
                'MERCY': 0x00FF00     # Green
            }.get(decision['verdict'], 0x808080)

            embed = {
                'title': f"{verdict_emoji} {decision['agent_name']} - {decision['verdict']}",
                'description': decision['reasoning'],
                'color': verdict_color,
                'fields': [
                    {
                        'name': 'Productivity',
                        'value': decision['productivity'],
                        'inline': True
                    },
                    {
                        'name': 'Offense Streak',
                        'value': str(decision['streak']),
                        'inline': True
                    }
                ],
                'timestamp': datetime.utcnow().isoformat()
            }
            embeds.append(embed)

        content += "\n💭 *Perfectly balanced, as all things should be.*"

        return self.send_message(content, embeds)

    def notify_balance_report(self, report: Dict) -> bool:
        """
        Send swarm balance report to Discord.

        Args:
            report: Dictionary containing swarm health metrics

        Returns:
            True if notification sent successfully
        """
        embed = {
            'title': '📈 Swarm Balance Report',
            'color': 0x9B59B6,  # Purple
            'fields': [
                {
                    'name': 'Total Agents',
                    'value': str(report['total_agents']),
                    'inline': True
                },
                {
                    'name': 'Productive Agents',
                    'value': str(report['productive_agents']),
                    'inline': True
                },
                {
                    'name': 'Timed Out',
                    'value': str(report['timed_out']),
                    'inline': True
                },
                {
                    'name': 'Disabled',
                    'value': str(report['disabled']),
                    'inline': True
                },
                {
                    'name': 'Overall Productivity',
                    'value': f"{report['swarm_productivity']:.1%}",
                    'inline': True
                }
            ],
            'timestamp': datetime.utcnow().isoformat(),
            'footer': {
                'text': 'Perfectly balanced, as all things should be.'
            }
        }

        return self.send_message('', [embed])

    def notify_agent_run(self, agent_name: str, productive: bool, work_summary: str) -> bool:
        """
        Notify about agent run completion.

        Args:
            agent_name: Name of the agent
            productive: Whether the run was productive
            work_summary: Summary of work done

        Returns:
            True if notification sent successfully
        """
        emoji = "✅" if productive else "❌"
        color = 0x00FF00 if productive else 0xFF0000

        embed = {
            'title': f"{emoji} {agent_name} Run Complete",
            'description': work_summary,
            'color': color,
            'timestamp': datetime.utcnow().isoformat()
        }

        return self.send_message('', [embed])


def notify_judgment(decisions_json: str):
    """
    CLI function to notify about Thanos judgment.

    Args:
        decisions_json: JSON string of decisions list
    """
    decisions = json.loads(decisions_json)
    notifier = DiscordNotifier()
    success = notifier.notify_thanos_judgment(decisions)
    sys.exit(0 if success else 1)


def notify_balance(report_json: str):
    """
    CLI function to send balance report.

    Args:
        report_json: JSON string of balance report
    """
    report = json.loads(report_json)
    notifier = DiscordNotifier()
    success = notifier.notify_balance_report(report)
    sys.exit(0 if success else 1)


def notify_agent(agent_name: str, productive: str, work_summary: str):
    """
    CLI function to notify about agent run.

    Args:
        agent_name: Name of agent
        productive: "true" or "false"
        work_summary: Summary of work
    """
    notifier = DiscordNotifier()
    success = notifier.notify_agent_run(
        agent_name,
        productive.lower() == 'true',
        work_summary
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage:")
        print("  python discord_notifier.py judgment <decisions_json>")
        print("  python discord_notifier.py balance <report_json>")
        print("  python discord_notifier.py agent <name> <productive> <summary>")
        sys.exit(1)

    command = sys.argv[1]

    if command == 'judgment':
        notify_judgment(sys.argv[2])
    elif command == 'balance':
        notify_balance(sys.argv[2])
    elif command == 'agent':
        notify_agent(sys.argv[2], sys.argv[3], sys.argv[4])
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)
