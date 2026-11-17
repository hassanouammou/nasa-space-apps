"""Deterministic simulation rules. All thresholds are fictional."""
DISCLAIMER = "Educational simulation only — not a medical monitoring or diagnostic system."


class HealthMonitor:
    def evaluate(self, values):
        critical = {
            "Heart rate at critical threshold": values["hr"] >= 125,
            "Fatigue at critical threshold": values["fatigue"] >= 90,
            "Blood oxygen below critical threshold": values["spo2"] < 90,
            "Body temperature outside critical range": not 35 <= values["temperature"] < 39,
            "Suit oxygen at critical reserve": values["oxygen"] <= 10,
        }
        attention = {
            "Heart rate elevated": values["hr"] >= 110,
            "Fatigue elevated": values["fatigue"] >= 70,
            "Blood oxygen below attention threshold": values["spo2"] < 94,
            "Body temperature outside attention range": not 36 <= values["temperature"] < 38,
            "Suit oxygen approaching reserve": values["oxygen"] <= 25,
        }
        for level, signals, guidance in [
            ("CRITICAL", critical, "Suspend sample collection. Compare return projections and choose a route within mission limits."),
            ("ATTENTION", attention, "Reduce exertion. Rest when available and preserve suit supplies for the return."),
        ]:
            reasons = [reason for reason, triggered in signals.items() if triggered]
            if reasons:
                return {"level": level, "reasons": reasons, "recommendation": guidance}
        return {"level": "NORMAL", "reasons": [], "recommendation": "Telemetry is within simulation limits. Keep a return reserve."}
