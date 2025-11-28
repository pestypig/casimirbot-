from pathlib import Path
p = Path('server/routes/agi.plan.ts')
text = p.read_text().splitlines()
targets = ['selectToolForGoal','chooseReasoningStrategy','buildCandidatePlansFromResonance','buildChatBPlan']
for target in targets:
    print(f'-- {target} --')
    for i,line in enumerate(text,1):
        if target in line:
            print(i, line.strip())
