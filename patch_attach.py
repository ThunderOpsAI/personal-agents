import re

app_js_path = "dashboard/public/app.js"
with open(app_js_path, "r") as f:
    content = f.read()

# Make sure postponeBtn is selected
if "const postponeBtn =" not in content:
    content = content.replace(
        "const dismissBtn = card.querySelector('.btn-dismiss');",
        "const dismissBtn = card.querySelector('.btn-dismiss');\n        const postponeBtn = card.querySelector('.btn-postpone');"
    )

# Attach event listener to postponeBtn
postpone_logic = """
        if (postponeBtn) {
            postponeBtn.addEventListener('click', () => {
                if (id) {
                    itemToPostpone = id;
                    postponeModal.classList.remove('hidden');
                }
            });
        }
"""
if "if (postponeBtn) {" not in content:
    content = content.replace(
        "if (dismissBtn) {",
        postpone_logic + "\n        if (dismissBtn) {"
    )

with open(app_js_path, "w") as f:
    f.write(content)
with open("dashboard/app.js", "w") as f:
    f.write(content)

print("Patch attachCardEvents done.")
