import sys
import os

# Set encoding for terminal output (handle emojis)
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from agents.decision_engine import _generate_verdict_explanation, VERDICT_THRESHOLDS

def test_explanations():
    print("Testing Decision Engine Explanations...")
    
    # Case 1: Authentic
    print("\n[CASE 1: AUTHENTIC]")
    res1 = _generate_verdict_explanation(95.0, 95.0, 95.0, 95.0, [])
    for line in res1:
        print(f"  {line}")

    # Case 2: Forged (Image + OCR)
    print("\n[CASE 2: FORGED]")
    res2 = _generate_verdict_explanation(35.0, 45.0, 50.0, 95.0, ["High ELA", "Text alignment failure"])
    for line in res2:
        print(f"  {line}")

    # Case 3: Suspicious (OCR only)
    print("\n[CASE 3: SUSPICIOUS]")
    res3 = _generate_verdict_explanation(65.0, 95.0, 60.0, 92.0, ["Minor text inconsistency"])
    for line in res3:
        print(f"  {line}")

if __name__ == "__main__":
    test_explanations()
