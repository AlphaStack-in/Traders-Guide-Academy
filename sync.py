import yaml
import subprocess

with open("backlog.yaml","r",encoding="utf-8") as f:
    data=yaml.safe_load(f)

repo=f"{data['project']['owner']}/{data['project']['repo']}"

print("Repository:",repo)

print("Creating Labels...")
for label in data["labels"]:
    subprocess.run(["gh","label","create",label,"--repo",repo,"--force"])

print("Creating Milestones...")
existing=subprocess.run(
    ["gh","api",f"repos/{repo}/milestones"],
    capture_output=True,
    text=True
).stdout

for m in data["milestones"]:
    if m in existing:
        continue
    subprocess.run([
        "gh","api",
        f"repos/{repo}/milestones",
        "-X","POST",
        "-f",f"title={m}"
    ])

print("Creating Issues...")

for epic in data["epics"]:

    subprocess.run([
        "gh","issue","create",
        "--repo",repo,
        "--title",epic["title"],
        "--label","Epic",
        "--body",f"Epic: {epic['title']}"
    ])

    for issue in epic["issues"]:
        subprocess.run([
            "gh","issue","create",
            "--repo",repo,
            "--title",issue,
            "--body",f"Part of Epic: {epic['title']}"
        ])

print("Done!")
